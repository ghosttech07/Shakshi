"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { COVERS } from "@shakshi/shared/products";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconCheck, IconMail } from "@/components/ui/Icons";
import { postJSON } from "@/lib/api";

type Errors = Partial<Record<"swatches" | "name" | "email" | "address" | "pincode", string>>;

export function SwatchRequest() {
  const [picked, setPicked] = useState<string[]>(["ivory", "oat"]);
  const [form, setForm] = useState({ name: "", email: "", address: "", pincode: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!picked.length) err.swatches = "Choose at least one swatch.";
    if (!form.name.trim()) err.name = "Please share your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Please share a valid email.";
    if (form.address.trim().length < 8) err.address = "Please share your full address.";
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) err.pincode = "A six-digit pincode, please.";
    setErrors(err);
    if (Object.keys(err).length) {
      document.getElementById(`sw-${Object.keys(err)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setSendError("");
    const r = await postJSON("/api/leads", { kind: "swatches", email: form.email, fields: { name: form.name, address: form.address, pincode: form.pincode, swatches: picked } });
    setBusy(false);
    if (r.ok) setSent(true);
    else setSendError(r.error);
  };

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={key === "address" ? "sm:col-span-2" : ""}>
      <label htmlFor={`sw-${key}`} className="eyebrow text-stone">{label}</label>
      <input
        id={`sw-${key}`}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: key === "pincode" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value })}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `sw-${key}-err` : undefined}
        className="field"
        {...props}
      />
      {errors[key] && <p id={`sw-${key}-err`} className="mt-1.5 text-xs text-[#9a5a4a]">{errors[key]}</p>}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="border border-gold/40 bg-gold/[0.06] p-10 text-center" role="status">
          <IconMail size={36} className="mx-auto text-gold-ink" />
          <p className="display mt-6 text-4xl">Your swatches are on their way.</p>
          <p className="mx-auto mt-4 max-w-md text-stone">
            {picked.map((id) => COVERS.find((c) => c.id === id)!.name).join(", ")}, wrapped in tissue, arriving within five days. Take your time with them, {form.name.split(" ")[0]}.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }}>
          <fieldset>
            <legend id="sw-swatches" tabIndex={-1} className="eyebrow text-stone focus:outline-none">
              Choose up to three · {picked.length}/3
            </legend>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {COVERS.map((c) => {
                const on = picked.includes(c.id);
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle(c.id)} disabled={!on && picked.length >= 3} className="group text-left disabled:opacity-40">
                    <span
                      className={cn("relative block aspect-square overflow-hidden transition-all duration-700 ease-silk", on ? "ring-1 ring-gold ring-offset-4 ring-offset-ivory" : "group-hover:-translate-y-1")}
                      style={{ background: `repeating-linear-gradient(0deg, rgb(0 0 0/.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(255 255 255/.06) 0 1px, transparent 1px 4px), ${c.hex}` }}
                    >
                      {on && (
                        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ivory text-ink">
                          <IconCheck size={13} />
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block text-sm">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.swatches && <p className="mt-2 text-xs text-[#9a5a4a]">{errors.swatches}</p>}
          </fieldset>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {field("name", "Full name", { autoComplete: "name" })}
            {field("email", "Email", { type: "email", autoComplete: "email" })}
            {field("address", "Delivery address", { autoComplete: "street-address" })}
            {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code" })}
          </div>
          {sendError && <p className="mt-6 text-sm text-[#9a5a4a]" role="alert">{sendError}</p>}
          <button type="submit" disabled={busy} aria-busy={busy} className="btn btn-dark mt-10">
            {busy ? "Sending…" : "Send my free swatches"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
