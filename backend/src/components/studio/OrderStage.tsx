"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { STAGES } from "@shakshi/shared/orders";
import { api } from "./actions";

/**
 * Sets an order's stage. Choosing a stage pins it (the customer's timeline shows it at once);
 * "Follow the delivery schedule" hands progress back to the calendar.
 */
export function OrderStage({ id, stage, mode }: { id: string; stage: string; mode: "auto" | "manual" }) {
  const router = useRouter();
  const [value, setValue] = useState(mode === "auto" ? "auto" : stage);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div>
      <label htmlFor="stage" className="label">
        Order status
      </label>
      <select
        id="stage"
        className="field"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          setError("");
          start(async () => {
            try {
              await api("PATCH", `/api/admin/records/orders/${encodeURIComponent(id)}`, next === "auto" ? { statusMode: "auto" } : { status: next });
              router.refresh();
            } catch (err) {
              setValue(prev);
              setError((err as Error).message);
            }
          });
        }}
      >
        <option value="auto">Follow the delivery schedule (now: {STAGES.find((s) => s.id === stage)?.admin})</option>
        {STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.admin}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-stone">{pending ? "Saving…" : "The customer's order timeline updates as soon as this changes."}</p>
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}
