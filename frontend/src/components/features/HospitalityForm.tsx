"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { postJSON } from "@/lib/api";
import { cn } from "@shakshi/shared/utils";
import { IconCheck } from "@/components/ui/Icons";

const TYPES = ["Hotel or resort", "Serviced apartments", "Hostel or co-living", "Corporate or offices", "Hospital or wellness", "Something else"];
const TIMELINES = ["Within a month", "1–3 months", "3–6 months", "Just exploring"];

/** Bulk and trade enquiries, saved in the studio's Inquiries for the trade team. */
export function HospitalityForm() {
  const [f, setF] = useState({ company: "", name: "", email: "", phone: "", city: "", type: TYPES[0], rooms: "", timeline: TIMELINES[1], message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.company.trim() || !f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !(Number(f.rooms) > 0)) {
      return setError("Please add your company, your name, a valid email and roughly how many beds you need.");
    }
    setError("");
    setState("busy");
    const r = await postJSON("/api/leads", { kind: "hospitality", email: f.email, fields: { ...f, rooms: String(Number(f.rooms)) } });
    if (r.ok) return setState("done");
    setError(r.error);
    setState("idle");
  };

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label>
      <span className="eyebrow text-stone">{label}</span>
      <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="field" {...props} />
    </label>
  );

  return (
    <AnimatePresence mode="wait">
      {state === "done" ? (
        <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/40 bg-gold/[0.06] p-10" role="status">
          <IconCheck size={32} className="text-gold-ink" />
          <p className="display mt-5 text-4xl">Thank you, {f.name.split(" ")[0]}.</p>
          <p className="mt-3 text-stone">Our trade team will be in touch within one working day with pricing, samples and lead times for {f.company}.</p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }} className="grid gap-6 sm:grid-cols-2">
          {field("company", "Company or property", { autoComplete: "organization" })}
          {field("city", "City", { autoComplete: "address-level2" })}
          {field("name", "Your name", { autoComplete: "name" })}
          {field("email", "Work email", { type: "email", autoComplete: "email" })}
          {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
          {field("rooms", "Beds needed (approx.)", { inputMode: "numeric" })}
          <fieldset className="sm:col-span-2">
            <legend className="eyebrow text-stone">Type of property</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button type="button" key={t} className="chip" aria-pressed={f.type === t} onClick={() => setF({ ...f, type: t })}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="sm:col-span-2">
            <legend className="eyebrow text-stone">Timeline</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIMELINES.map((t) => (
                <button type="button" key={t} className="chip" aria-pressed={f.timeline === t} onClick={() => setF({ ...f, timeline: t })}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="sm:col-span-2">
            <span className="eyebrow text-stone">Anything else (sizes, custom dimensions, fabrics)</span>
            <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={3} className="field resize-none" />
          </label>
          {error && <p className="text-sm text-[#9a5a4a] sm:col-span-2" role="alert">{error}</p>}
          <button type="submit" disabled={state === "busy"} aria-busy={state === "busy"} className={cn("btn btn-dark justify-self-start")}>
            {state === "busy" ? "Sending…" : "Request trade pricing"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
