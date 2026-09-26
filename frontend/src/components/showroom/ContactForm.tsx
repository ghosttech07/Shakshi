"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { CONTACT } from "@shakshi/shared/products";
import { EASE } from "@shakshi/shared/utils";
import { IconCheck, IconPhone, IconWhatsApp, IconMail } from "@/components/ui/Icons";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "Choosing a mattress", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.message.trim().length < 5) {
      return setError("Please share your name, a valid email and a short message.");
    }
    setError("");
    setSent(true);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
      <div className="space-y-3">
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 border border-ink/10 p-5 transition-colors duration-700 hover:border-gold">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1f3b2d] text-pearl"><IconWhatsApp size={22} /></span>
          <span>
            <span className="block font-serif text-xl">WhatsApp a concierge</span>
            <span className="block text-sm text-stone">Replies within minutes, 9am–11pm</span>
          </span>
        </a>
        <a href={CONTACT.phoneHref} className="flex items-center gap-4 border border-ink/10 p-5 transition-colors duration-700 hover:border-gold">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-midnight text-gold"><IconPhone size={22} /></span>
          <span>
            <span className="block font-serif text-xl">{CONTACT.phone}</span>
            <span className="block text-sm text-stone">Toll-free, every day</span>
          </span>
        </a>
        <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-4 border border-ink/10 p-5 transition-colors duration-700 hover:border-gold">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/20 text-gold-ink"><IconMail size={22} /></span>
          <span>
            <span className="block font-serif text-xl">Write to us</span>
            <span className="block text-sm text-stone">{CONTACT.email}</span>
          </span>
        </a>
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} role="status" className="self-center">
            <IconCheck size={32} className="text-gold-ink" />
            <p className="display mt-5 text-4xl">Thank you, {form.name.split(" ")[0]}.</p>
            <p className="mt-3 text-stone">A concierge will reply to {form.email} within a few hours.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }} className="grid gap-6 sm:grid-cols-2">
            <label>
              <span className="eyebrow text-stone">Name</span>
              <input autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
            </label>
            <label>
              <span className="eyebrow text-stone">Email</span>
              <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" />
            </label>
            <label className="sm:col-span-2">
              <span className="eyebrow text-stone">How can we help?</span>
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="field">
                {["Choosing a mattress", "An existing order", "Delivery & set-up", "My 100-night trial", "Warranty", "Something else"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="eyebrow text-stone">Message</span>
              <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="field resize-none" />
            </label>
            {error && <p className="text-sm text-[#9a5a4a] sm:col-span-2" role="alert">{error}</p>}
            <button type="submit" className="btn btn-dark justify-self-start">
              Send message
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
