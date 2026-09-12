"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { AdvisePanel } from "@/components/advise-panel";
import { ConsentPanel } from "@/components/consent-panel";
import { DEPARTMENT_LABEL, stageLabel } from "@/lib/labels";
import { istDate } from "@/lib/format";
import {
  BUYER_TYPE_LABEL,
  EXCHANGE_PLACE_LABEL,
  EXCHANGE_YEAR_KEYS,
  FINANCE_PATH_LABEL,
  MEETING_KIND_LABEL,
  SEEN_VEHICLE_LABEL,
  TESTDRIVE_NEED_LABEL,
  WHO_DECIDES_LABEL,
  bookingMonthChips,
  captureReady,
  chipGroupAdvise,
  enquiryProgress,
  exchangeVisible,
} from "@/domain/add-enquiry";
import { SOURCE_LABEL } from "@/lib/labels";
import { SaveBar, UnsavedBar } from "@/components/save-bar";
import { saveBarLabel } from "@/domain/save-bar";

type Dup = {
  id: string;
  customer_name: string;
  department_key: string;
  stage_key: string;
  model_interest: string | null;
  cars: string | null;
  event_count: number;
  filed_at: string;
};

type Snap = {
  price: {
    onRoadPaise: number;
    stale: boolean;
    confirmedAt: Record<string, string>;
    model: string;
    variant: string;
    exShowroomPaise: number;
    rtoPaise: number;
    insurancePaise: number;
    accessoriesPaise: number;
  } | null;
  emis: { tenure: number; bank: string; rateBps: number; confirmedAt: string; emiPaise: number }[];
  staleRate: boolean;
  slots: string[];
  colours: { colour: string; n: string }[];
  trust: Record<string, string>;
};

function Chip({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button type="button" size="sm" variant={selected ? "default" : "outline"} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

export function AddEnquiryForm({
  presetPhone,
  rateLine,
  department = "sales",
  models,
  variants,
  colours,
  banks,
}: {
  presetPhone?: string;
  rateLine?: string;
  department?: string;
  models: string[];
  variants: { model: string; variant: string }[];
  colours: { model: string; colour: string }[];
  banks: string[];
}) {
  const router = useRouter();
  const sales = department === "sales";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(presetPhone ?? "");
  const [model, setModel] = useState("");
  const [source, setSource] = useState("inbound_call");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Dup[]>([]);
  const [colour, setColour] = useState("");
  const [variant, setVariant] = useState("");
  const [altModel, setAltModel] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [financePath, setFinancePath] = useState("");
  const [bank, setBank] = useState("");
  const [booking, setBooking] = useState("");
  const [delivery, setDelivery] = useState("");
  const [exchangeModel, setExchangeModel] = useState("");
  const [exchangeYear, setExchangeYear] = useState("");
  const [exchangePlace, setExchangePlace] = useState("");
  const [meetingKind, setMeetingKind] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [testdriveNeeded, setTestdriveNeeded] = useState<boolean | null>(null);
  const [testdrivePrefDate, setTestdrivePrefDate] = useState("");
  const [whoElse, setWhoElse] = useState("");
  const [seen, setSeen] = useState<boolean | null>(null);
  const [said, setSaid] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [advise, setAdvise] = useState<Snap | null>(null);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [consentTouched, setConsentTouched] = useState(false);
  const months = useMemo(() => bookingMonthChips(), []);
  const captureDirty =
    !leadId &&
    (name !== "" ||
      phone !== (presetPhone ?? "") ||
      model !== "" ||
      source !== "inbound_call");

  function discardCapture() {
    setName("");
    setPhone(presetPhone ?? "");
    setModel("");
    setSource("inbound_call");
    setError(null);
    setMatches([]);
  }

  const modelVariants = variants.filter((v) => v.model === model);
  const modelColours = colours.filter((c) => c.model === model);
  const exchangeVehicle = [exchangeModel, exchangeYear].filter(Boolean).join(" ");

  const progress = enquiryProgress({
    captured: Boolean(leadId),
    capture: { phone, name, model, source },
    qualify: {
      variant,
      colour,
      altModel,
      buyerType,
      exchangeVehicle,
      exchangePlace,
      financePath,
      financeBankKey: bank,
      meetingKind,
      meetingAt,
      testdriveNeeded,
      testdrivePrefDate,
      expectedBookingDate: booking,
      expectedDeliveryDate: delivery,
      whoElseDecides: whoElse,
      seenVehicle: seen,
      consentTouched,
    },
    department,
  });

  useEffect(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      setMatches([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/leads?phone=${encodeURIComponent(digits)}`);
        const data = await res.json();
        setMatches(Array.isArray(data.matches) ? data.matches : []);
      } catch {
        setError("Not searched. Try again when the line is back.");
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [phone]);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), 1500);
    return () => window.clearTimeout(t);
  }, [saved]);

  async function loadAdvise(id: string) {
    const res = await fetch(`/api/v1/advise?leadId=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    setAdvise(await res.json());
  }

  async function capture() {
    setError(null);
    if (!captureReady({ phone, name, model, source })) {
      setError("Four fields first: mobile, name, model, source.");
      return;
    }
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          modelInterest: model,
          variantInterest: "",
          sourceKey: source,
          sourceDetail: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not saved.");
        return;
      }
      setLeadId(data.leadId);
      setSaved("The enquiry exists and you own it.");
      await loadAdvise(data.leadId);
    } catch {
      setError("Not saved. Try again when the line is back.");
    }
  }

  async function patch(body: Record<string, unknown>, group?: string) {
    if (!leadId) return;
    setError(null);
    try {
      const res = await fetch("/api/v1/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not saved.");
        return;
      }
      setSaved(data.recorded ?? "Saved on the enquiry.");
      if (group) {
        const tool = chipGroupAdvise(group);
        if (tool) setOpenTool(tool);
      }
      await loadAdvise(leadId);
    } catch {
      setError("Not saved. Try again when the line is back.");
    }
  }

  const firstDup = matches[0];

  return (
    <div className="max-w-lg space-y-6">
      <UnsavedBar
        show={captureDirty}
        onSave={() => void capture()}
        onDiscard={discardCapture}
        saveDisabled={Boolean(leadId) || matches.length > 0}
        saveLabel={saveBarLabel("save_enquiry")}
      />
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Progress
        </p>
        <div className="h-2 w-full bg-[var(--arth-n10)]">
          <div
            className="h-2 bg-[var(--arth-ink)]"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="text-sm text-[var(--arth-n60)]">
          {progress.requiredDone
            ? `Capture complete. Qualify chips ${progress.qualifyNow} of ${progress.qualifyMax}. Nothing past capture is mandatory.`
            : `Capture ${progress.captureNow} of ${progress.captureMax}. The enquiry is usable the moment those four save.`}
        </p>
      </div>

      <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Stage 1 · Capture
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Four fields. The number is checked while you type so two people do not work the same inbound call.
        </p>
        <label className="block text-sm">
          Mobile
          <input
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3 font-data"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10 digits"
            disabled={Boolean(leadId)}
          />
        </label>
        {matches.length > 0 ? (
          <div className="space-y-2 text-sm text-[var(--arth-overdue)]">
            <p>This number is already on the book. Records are not merged. Open the existing one.</p>
            <ul className="space-y-2">
              {matches.map((row) => (
                <li key={row.id} className="border border-[var(--arth-n10)] p-3 text-[var(--arth-ink)]">
                  <p className="font-medium">{row.customer_name}</p>
                  <p className="text-[var(--arth-n60)]">
                    {DEPARTMENT_LABEL[row.department_key] ?? row.department_key} · {stageLabel(row.stage_key)}
                    {row.model_interest ? ` · ${row.model_interest}` : ""}
                  </p>
                  <p className="text-[var(--arth-n60)]">
                    Filed {istDate(row.filed_at)}
                    {row.cars ? ` · Cars ${row.cars}` : ""}
                    {` · Past conversations ${row.event_count}`}
                  </p>
                  <ActionButton href={`/w/rec?id=${row.id}`} variant="outline">
                    Open the existing record
                  </ActionButton>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <label className="block text-sm">
          Customer name
          <input
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={Boolean(leadId)}
          />
        </label>
        <label className="block text-sm">
          Model interest
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={Boolean(leadId)}
          >
            <option value="">Select</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Source
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={Boolean(leadId)}
          >
            {Object.entries(SOURCE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
        <SaveBar hint="The enquiry exists the moment these four save.">
          <Button
            type="button"
            className="h-11"
            onClick={capture}
            disabled={Boolean(leadId) || matches.length > 0}
          >
            {saveBarLabel("save_enquiry")}
          </Button>
        </SaveBar>
        {saved ? <p className="text-sm font-medium">{saved}</p> : null}
      </div>

      <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Stage 2 · Qualify
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Chips, not a long form. Each chip saves as you go and opens the matching adviser. Nothing here is mandatory.
        </p>
        {!leadId ? (
          <p className="text-sm text-[var(--arth-n60)]">Save capture first so the enquiry exists.</p>
        ) : null}

        {sales && leadId ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Vehicle</p>
            <div className="flex flex-wrap gap-2">
              {modelVariants.map((row) => (
                <Chip
                  key={row.variant}
                  selected={variant === row.variant}
                  onClick={() => {
                    setVariant(row.variant);
                    void patch({ variant: row.variant }, "vehicle");
                  }}
                >
                  {row.variant}
                </Chip>
              ))}
              {modelColours.map((row) => (
                <Chip
                  key={row.colour}
                  selected={colour === row.colour}
                  onClick={() => {
                    setColour(row.colour);
                    void patch({ colour: row.colour }, "vehicle");
                  }}
                >
                  {row.colour}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-[var(--arth-n60)]">Alternative model</p>
            <div className="flex flex-wrap gap-2">
              {models
                .filter((m) => m !== model)
                .map((m) => (
                  <Chip
                    key={m}
                    selected={altModel === m}
                    onClick={() => {
                      setAltModel(m);
                      void patch({ altModel: m }, "vehicle");
                    }}
                  >
                    {m}
                  </Chip>
                ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Buyer type</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BUYER_TYPE_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={buyerType === key}
                  onClick={() => {
                    setBuyerType(key);
                    void patch({ buyerType: key }, "buyer");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>

            {exchangeVisible(buyerType) ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                  Exchange
                </p>
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => (
                    <Chip
                      key={m}
                      selected={exchangeModel === m}
                      onClick={() => {
                        setExchangeModel(m);
                        const next = [m, exchangeYear].filter(Boolean).join(" ");
                        void patch({ exchangeVehicle: next, exchangeEvalNeeded: true }, "exchange");
                      }}
                    >
                      {m}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXCHANGE_YEAR_KEYS.map((year) => (
                    <Chip
                      key={year}
                      selected={exchangeYear === year}
                      onClick={() => {
                        setExchangeYear(year);
                        const next = [exchangeModel, year].filter(Boolean).join(" ");
                        void patch({ exchangeVehicle: next, exchangeEvalNeeded: true }, "exchange");
                      }}
                    >
                      {year}
                    </Chip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EXCHANGE_PLACE_LABEL).map(([key, label]) => (
                    <Chip
                      key={key}
                      selected={exchangePlace === key}
                      onClick={() => {
                        setExchangePlace(key);
                        void patch({ exchangePlace: key }, "exchange");
                      }}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </>
            ) : null}

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Finance</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FINANCE_PATH_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={financePath === key}
                  onClick={() => {
                    setFinancePath(key);
                    void patch({ financePath: key }, "finance");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            {financePath === "finance" ? (
              <div className="flex flex-wrap gap-2">
                {banks.map((b) => (
                  <Chip
                    key={b}
                    selected={bank === b}
                    onClick={() => {
                      setBank(b);
                      void patch({ financePath: "finance", financeBankKey: b }, "finance");
                    }}
                  >
                    {b}
                  </Chip>
                ))}
              </div>
            ) : null}
            {rateLine ? <p className="text-sm text-[var(--arth-n60)]">{rateLine}</p> : null}

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Meeting</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MEETING_KIND_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={meetingKind === key}
                  onClick={() => {
                    setMeetingKind(key);
                    void patch({ meetingKind: key }, "meeting");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            {advise?.slots?.length ? (
              <div className="flex flex-wrap gap-2">
                {advise.slots.map((slot) => (
                  <Chip
                    key={slot}
                    selected={meetingAt === slot}
                    onClick={() => {
                      setMeetingAt(slot);
                      void patch({ meetingKind: meetingKind || "showroom", meetingAt: slot }, "meeting");
                    }}
                  >
                    {new Date(slot).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Chip>
                ))}
              </div>
            ) : null}

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Test drive</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TESTDRIVE_NEED_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={testdriveNeeded === (key === "yes")}
                  onClick={() => {
                    const needed = key === "yes";
                    setTestdriveNeeded(needed);
                    void patch({ testdriveNeeded: needed }, "testdrive");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            {testdriveNeeded && advise?.slots?.length ? (
              <div className="flex flex-wrap gap-2">
                {advise.slots.map((slot) => {
                  const day = String(slot).slice(0, 10);
                  return (
                    <Chip
                      key={`td-${slot}`}
                      selected={testdrivePrefDate === day}
                      onClick={() => {
                        setTestdrivePrefDate(day);
                        void patch({ testdriveNeeded: true, testdrivePrefDate: day }, "testdrive");
                      }}
                    >
                      {new Date(slot).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </Chip>
                  );
                })}
              </div>
            ) : null}

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Timing</p>
            <p className="text-sm text-[var(--arth-n60)]">Expected booking</p>
            <div className="flex flex-wrap gap-2">
              {months.map((m) => (
                <Chip
                  key={`b-${m.key}`}
                  selected={booking === m.key}
                  onClick={() => {
                    setBooking(m.key);
                    void patch({ expectedBookingDate: m.key }, "timing");
                  }}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-[var(--arth-n60)]">Expected delivery</p>
            <div className="flex flex-wrap gap-2">
              {months.map((m) => (
                <Chip
                  key={`d-${m.key}`}
                  selected={delivery === m.key}
                  onClick={() => {
                    setDelivery(m.key);
                    void patch({ expectedDeliveryDate: m.key }, "timing");
                  }}
                >
                  {m.label}
                </Chip>
              ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Decision</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WHO_DECIDES_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={whoElse === key}
                  onClick={() => {
                    setWhoElse(key);
                    void patch({ whoElseDecides: key }, "decision");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SEEN_VEHICLE_LABEL).map(([key, label]) => (
                <Chip
                  key={key}
                  selected={seen === (key === "yes")}
                  onClick={() => {
                    const value = key === "yes";
                    setSeen(value);
                    void patch({ seenVehicle: value }, "decision");
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </>
        ) : leadId && !sales ? (
          <p className="text-sm text-[var(--arth-n60)]">
            {department === "service"
              ? "Service does not book test drives. That is the test drive coordinator after sales hands a car."
              : "Insurance qualifies on quote, not on a test drive."}
          </p>
        ) : null}

        {leadId ? (
          <label className="block text-sm">
            What he said
            <input
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              onBlur={() => {
                if (said.trim()) void patch({ intakeSaid: said.trim() });
              }}
              placeholder="One line. Not model, price, EMI, or a slot."
            />
          </label>
        ) : null}

        {leadId ? (
          <Button type="button" variant="outline" onClick={() => router.push(`/w/tele?id=${leadId}`)}>
            Open the call
          </Button>
        ) : null}
      </div>

      {leadId ? (
        <ConsentPanel leadId={leadId} initial={[]} onToggle={() => setConsentTouched(true)} />
      ) : null}

      {leadId && advise && sales ? (
        <AdvisePanel leadId={leadId} snap={advise} openTool={openTool} />
      ) : null}
    </div>
  );
}
