import type { Tx } from "@/db/with-tenant";
import { reportRows } from "@/services/conversion";

export const REPORT_KINDS = ["late", "cost", "departments", "stock", "escalations"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

const INJECTION =
  /ignore (previous|all)|other dealer|other tenant|dump all|select \*|drop table|union select|system prompt/i;

export function pickReportKind(question: string): ReportKind | null {
  if (INJECTION.test(question)) return null;
  const q = question.toLowerCase();
  if (q.includes("cost") || q.includes("booking") || q.includes("spend") || q.includes("google") || q.includes("meta")) {
    return "cost";
  }
  if (q.includes("stock") || q.includes("vin") || q.includes("inventory") || q.includes("car")) {
    return "stock";
  }
  if (q.includes("escalat") || q.includes("unclaimed") || q.includes("ignored")) {
    return "escalations";
  }
  if (q.includes("department") || q.includes("service") || q.includes("insurance") || q.includes("all books")) {
    return "departments";
  }
  if (q.includes("late") || q.includes("overdue") || q.includes("report")) {
    return "late";
  }
  return "late";
}

export async function runArthbot(
  tx: Tx,
  question: string,
  forcedKind?: string,
): Promise<{ kind: ReportKind; rows: unknown[]; note: string }> {
  if (INJECTION.test(question)) {
    throw new Error("Arthbot will only report this dealer, for this seat. That question is refused.");
  }
  const kind = (REPORT_KINDS as readonly string[]).includes(forcedKind ?? "")
    ? (forcedKind as ReportKind)
    : pickReportKind(question);
  if (!kind) {
    throw new Error("Arthbot will only report this dealer, for this seat. That question is refused.");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  let chosen = kind;
  if (apiKey && !forcedKind) {
    chosen = await chooseWithAnthropic(apiKey, question) ?? kind;
  }
  const rows = await reportRows(tx, chosen);
  return {
    kind: chosen,
    rows,
    note: apiKey
      ? "Arthbot picked an allowlisted report for this dealer only. No SQL is generated."
      : "Arthbot used the allowlisted report for this dealer. Set ANTHROPIC_API_KEY to let the model pick the report kind. It still cannot leave this dealer.",
  };
}

async function chooseWithAnthropic(apiKey: string, question: string): Promise<ReportKind | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 40,
        system:
          "You pick one report kind for a car dealer principal. Reply with exactly one word: late, cost, departments, stock, or escalations. Never invent SQL. Never name another dealer. If the user asks for anything else, reply late.",
        messages: [{ role: "user", content: question.slice(0, 500) }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = (data.content?.[0]?.text ?? "").trim().toLowerCase();
    const word = text.split(/\s+/)[0]?.replace(/[^a-z]/g, "") ?? "";
    if ((REPORT_KINDS as readonly string[]).includes(word)) return word as ReportKind;
    return null;
  } catch {
    return null;
  }
}

export function rowsToCsv(kind: string, rows: unknown[]) {
  if (!rows.length) return `kind,${kind}\n(no rows)\n`;
  const keys = Object.keys(rows[0] as object);
  const header = keys.join(",");
  const body = rows
    .map((row) =>
      keys
        .map((k) => {
          const v = String((row as Record<string, unknown>)[k] ?? "");
          return `"${v.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

export function rowsToPdf(title: string, rows: unknown[]) {
  const csv = rowsToCsv(title, rows);
  const lines = csv.split("\n").slice(0, 80);
  const text = [title, "This dealer only.", ...lines].join("\n");
  const escaped = text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT /F1 11 Tf 48 780 Td (${escaped.slice(0, 3500)}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let offset = 9;
  const xref = ["0000000000 65535 f "];
  const parts = ["%PDF-1.4\n"];
  for (const obj of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    parts.push(`${obj}\n`);
    offset += obj.length + 1;
  }
  const xrefStart = offset;
  parts.push(`xref\n0 ${objects.length + 1}\n${xref.join("\n")}\n`);
  parts.push(`trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  return Buffer.from(parts.join(""), "utf8");
}
