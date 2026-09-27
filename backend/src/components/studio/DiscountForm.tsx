"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { api } from "./actions";

export function DiscountForm() {
  const router = useRouter();
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    setError("");
    setDone("");
    start(async () => {
      try {
        const r = await api<{ code: string }>("POST", "/api/admin/discounts", { ...f, type });
        setDone(`${r.code} is live.`);
        form.reset();
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label" htmlFor="code">
          Code
        </label>
        <input id="code" name="code" required className="field uppercase" placeholder="DIWALI10" autoComplete="off" />
      </div>
      <fieldset>
        <legend className="label">Discount</legend>
        <div className="flex gap-2">
          <select aria-label="Type" className="field w-28" value={type} onChange={(e) => setType(e.target.value as "percent" | "flat")}>
            <option value="percent">% off</option>
            <option value="flat">₹ off</option>
          </select>
          <input name="value" type="number" min={1} max={type === "percent" ? 100 : undefined} required aria-label={type === "percent" ? "Percentage" : "Amount in rupees"} className="field" placeholder={type === "percent" ? "10" : "5000"} />
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="expiresAt">
          Expires (optional)
        </label>
        <input id="expiresAt" name="expiresAt" type="date" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="usageLimit">
          Usage limit (optional)
        </label>
        <input id="usageLimit" name="usageLimit" type="number" min={1} className="field" placeholder="Unlimited" />
      </div>
      <div>
        <label className="label" htmlFor="minSubtotal">
          Minimum order ₹ (optional)
        </label>
        <input id="minSubtotal" name="minSubtotal" type="number" min={0} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="note">
          Note for the team (optional)
        </label>
        <input id="note" name="note" className="field" placeholder="Festive campaign" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button className="btn btn-gold" disabled={pending}>
          {pending ? "Creating…" : "Create code"}
        </button>
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        {done && <p className="text-sm text-ok" role="status">{done}</p>}
      </div>
    </form>
  );
}
