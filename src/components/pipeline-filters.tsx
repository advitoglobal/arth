"use client";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import {
  PIPE_OVERDUE,
  PIPE_PARKED,
  PIPE_SOURCE_KEYS,
  sourceFilterLabel,
} from "@/domain/pipeline-filters";
import type { PipelineOwner } from "@/services/telecalling";
import type { FormEvent } from "react";

export function pipeHref(opts: {
  stage?: string;
  source?: string;
  overdue?: string;
  parked?: string;
  owner?: string;
}) {
  const q = new URLSearchParams();
  if (opts.stage) q.set("stage", opts.stage);
  if (opts.source) q.set("source", opts.source);
  if (opts.overdue) q.set("overdue", opts.overdue);
  if (opts.parked) q.set("parked", opts.parked);
  if (opts.owner) q.set("owner", opts.owner);
  const s = q.toString();
  return s ? `/w/pipe?${s}` : "/w/pipe";
}

export function PipelineFiltersForm({
  stage,
  source,
  overdue,
  parked,
  owner,
  owners,
}: {
  stage?: string;
  source?: string;
  overdue?: string;
  parked?: string;
  owner?: string;
  owners: PipelineOwner[];
}) {
  const active = Boolean(source || overdue || parked || owner);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    window.location.assign(
      pipeHref({
        stage: String(fd.get("stage") ?? "") || undefined,
        source: String(fd.get("source") ?? "") || undefined,
        overdue: String(fd.get("overdue") ?? "") || undefined,
        parked: String(fd.get("parked") ?? "") || undefined,
        owner: String(fd.get("owner") ?? "") || undefined,
      }),
    );
  }
  return (
    <form method="get" onSubmit={submit} className="space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Filter
      </p>
      <p className="text-sm text-[var(--arth-n60)]">
        Source, overdue, and parked. Parked is a postponed revisit still in the future, not a stage.
        {owners.length > 0 ? " Assigned person stays inside your bucket." : " This list is your book only."}
      </p>
      {stage ? <input type="hidden" name="stage" value={stage} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          Source
          <select
            name="source"
            defaultValue={source ?? ""}
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          >
            <option value="">Any</option>
            {PIPE_SOURCE_KEYS.map((key) => (
              <option key={key} value={key}>
                {sourceFilterLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Overdue
          <select
            name="overdue"
            defaultValue={overdue ?? ""}
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          >
            <option value="">Any</option>
            {PIPE_OVERDUE.map((row) => (
              <option key={row.key} value={row.key}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Parked
          <select
            name="parked"
            defaultValue={parked ?? ""}
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          >
            <option value="">Any</option>
            {PIPE_PARKED.map((row) => (
              <option key={row.key} value={row.key}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
        {owners.length > 0 ? (
          <label className="block text-sm">
            Assigned person
            <select
              name="owner"
              defaultValue={owner ?? ""}
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            >
              <option value="">Anyone in this bucket</option>
              {owners.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-end gap-2">
          <Button type="submit" className="h-11">
            Apply filters
          </Button>
          {active ? <ActionButton href={pipeHref({ stage })}>Clear</ActionButton> : null}
        </div>
      </div>
    </form>
  );
}
