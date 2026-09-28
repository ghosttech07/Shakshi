"use client";

import { useSite } from "@/lib/site-context";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconArrow, IconArrowLeft, IconCalendar, IconCheck } from "@/components/ui/Icons";
import { postJSON } from "@/lib/api";
import { track } from "@/lib/analytics";

type Kind = "salon" | "home" | "video";

const SLOTS = ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30"];
const VIDEO_SLOTS = ["10:00", "10:30", "11:30", "13:00", "15:00", "16:30", "18:00", "19:30"];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const longFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
// A gentle, deterministic sprinkling of already-booked slots, so the calendar feels real.
const isTaken = (d: Date, slot: string) => (d.getDate() * 7 + slot.charCodeAt(1) * 3 + slot.charCodeAt(3) + d.getMonth()) % 5 === 0;

function toICS(title: string, start: Date, minutes: number, location: string, note = "We'll have tea waiting.") {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(start.getTime() + minutes * 60000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shakshi//Booking//EN", "BEGIN:VEVENT",
    `UID:${start.getTime()}@shakshi`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${title}`, `LOCATION:${location}`, `DESCRIPTION:${note}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function Booking({ salon, setSalon, initialKind = "salon" }: { salon: string; setSalon: (id: string) => void; initialKind?: Kind }) {
  const SHOWROOMS = useSite().showrooms;
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  // No salons listed: salon visits aren't offered, and the form opens on a home trial
  const hasSalons = SHOWROOMS.length > 0;
  const [kind, setKind] = useState<Kind>(initialKind === "salon" && !hasSalons ? "home" : initialKind);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", topic: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // Available days depend on the visitor's own date, so the grid is drawn in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const s = SHOWROOMS.find((x) => x.id === salon) ?? SHOWROOMS[0];
  const maxDate = new Date(today.getTime() + 60 * 86400000);

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const disabled = (d: Date) => (kind === "video" ? d < today : d <= today) || d > maxDate || (kind === "home" && d.getDay() === 0);

  const slots = kind === "video" ? VIDEO_SLOTS : SLOTS;
  const minutes = kind === "video" ? 15 : 60;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date || !slot) return setError("Please choose a date and a time.");
    if (!form.name.trim() || !/^[+\d\s-]{8,}$/.test(form.phone)) return setError("Please share your name and a phone number we can reach you on.");
    if (kind === "home" && form.address.trim().length < 8) return setError("Please share the address for your home trial.");
    if (kind === "video" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("We'll send your video link by email, so please share it.");
    setError("");
    setBusy(true);
    const when = new Date(date.getFullYear(), date.getMonth(), date.getDate(), +slot.split(":")[0], +slot.split(":")[1]);
    const r = await postJSON<{ id: string; meetingUrl?: string }>("/api/bookings", { kind, start: when.toISOString(), name: form.name, phone: form.phone, email: form.email, salon, address: form.address, topic: form.topic });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setMeetingUrl(r.data.meetingUrl ?? null);
    track(kind === "video" ? "consultation_booked" : "booking_requested", { kind });
    setDone(true);
  };

  const start = date && slot ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), +slot.split(":")[0], +slot.split(":")[1]) : null;
  const title = kind === "salon" ? `Shakshi salon visit${s ? ` · ${s.city}` : ""}` : kind === "home" ? "Shakshi home trial" : "Shakshi sleep consultation (video)";
  const location = kind === "salon" ? s?.address ?? "" : kind === "home" ? form.address : meetingUrl ?? "Video call";
  const icsHref = start ? `data:text/calendar;charset=utf-8,${encodeURIComponent(toICS(title, start, minutes, location, kind === "video" ? `Join: ${meetingUrl ?? ""}` : undefined))}` : "#";

  if (done && start)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="border border-gold/40 bg-gold/[0.06] p-8 sm:p-12" role="status">
        <IconCheck size={36} className="text-gold-ink" />
        <p className="display mt-6 text-4xl sm:text-5xl">
          {kind === "video" ? `Your call is booked, ${form.name.split(" ")[0]}.` : `We’ll be expecting you, ${form.name.split(" ")[0]}.`}
        </p>
        <p className="mt-5 text-lg">{longFmt.format(start)} at {slot}</p>
        <p className="mt-1 text-stone">{kind === "salon" && s ? s.name + ", " + s.address : kind === "home" ? `Home trial at ${form.address}` : "15 minutes with a Shakshi sleep specialist"}</p>
        <p className="mt-6 max-w-md text-sm text-stone">
          {kind === "video" ? `We've emailed the link to ${form.email}. Join from your phone or laptop a minute early; no app needed.` : "A confirmation is on its way by SMS. Your sleep specialist will call the day before, just to say hello."}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {meetingUrl && (
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
              Your video room <IconArrow size={16} />
            </a>
          )}
          <a href={icsHref} download={kind === "video" ? "shakshi-consultation.ics" : "shakshi-visit.ics"} className="btn btn-dark">
            <IconCalendar size={16} /> Add to calendar
          </a>
          <button onClick={() => { setDone(false); setDate(null); setSlot(null); setMeetingUrl(null); }} className="btn btn-outline">
            Book another
          </button>
        </div>
      </motion.div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div>
        <div role="radiogroup" aria-label="Type of visit" className={cn("grid gap-2", hasSalons ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {[
            { id: "salon" as const, t: "Salon visit", d: "Lie down on every bed, with tea" },
            { id: "home" as const, t: "Home trial", d: "A specialist brings samples to you" },
            { id: "video" as const, t: "Video call", d: "15 free minutes with a sleep specialist" },
          ]
            .filter((o) => o.id !== "salon" || hasSalons)
            .map((o) => (
            <button type="button" key={o.id} role="radio" aria-checked={kind === o.id} onClick={() => { setKind(o.id); setDate(null); setSlot(null); }} className={cn("border p-4 text-left transition-all duration-700", kind === o.id ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
              <span className="block font-serif text-xl">{o.t}</span>
              <span className={cn("block text-xs", kind === o.id ? "text-pearl/60" : "text-stone")}>{o.d}</span>
            </button>
          ))}
        </div>

        {kind === "salon" && hasSalons && (
          <label className="mt-6 block">
            <span className="eyebrow text-stone">Salon</span>
            <select value={salon} onChange={(e) => setSalon(e.target.value)} className="field">
              {SHOWROOMS.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-25">
              <IconArrowLeft size={16} />
            </button>
            <p className="font-serif text-2xl" aria-live="polite">{mounted ? monthFmt.format(month) : " "}</p>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} disabled={new Date(month.getFullYear(), month.getMonth() + 1, 1) > maxDate} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-25">
              <IconArrow size={16} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="group" aria-label="Choose a date">
            {WEEKDAYS.map((w) => (
              <span key={w} className="pb-2 text-[0.65rem] uppercase tracking-[0.2em] text-stone" aria-hidden>{w}</span>
            ))}
            {mounted && days.map((d, i) =>
              d ? (
                <button
                  type="button"
                  key={i}
                  disabled={disabled(d)}
                  onClick={() => { setDate(d); setSlot(null); }}
                  aria-pressed={!!date && sameDay(d, date)}
                  aria-label={longFmt.format(d)}
                  className={cn(
                    "aspect-square rounded-full text-sm transition-all duration-500",
                    date && sameDay(d, date) ? "bg-midnight text-pearl" : "hover:bg-gold/15",
                    "disabled:cursor-not-allowed disabled:text-ink/20 disabled:hover:bg-transparent"
                  )}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={i} />
              )
            )}
          </div>
        </div>
      </div>

      <div>
        <AnimatePresence mode="wait">
          {date ? (
            <motion.div key={date.toDateString()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <p className="eyebrow text-stone">{longFmt.format(date)}</p>
              <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a time">
                {slots.map((t) => {
                  const taken = isTaken(date, t);
                  return (
                    <button type="button" key={t} role="radio" aria-checked={slot === t} disabled={taken} onClick={() => setSlot(t)} className={cn("border py-3 text-sm transition-all duration-500", slot === t ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold", "disabled:border-dashed disabled:text-ink/25 disabled:line-through")}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-stone">
              <IconCalendar size={20} className="text-gold-ink" /> Choose a day to see available times.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {([
            ["name", "Full name", "name", "text"],
            ["phone", "Phone", "tel", "tel"],
            ["email", kind === "video" ? "Email (for your video link)" : "Email (optional)", "email", "email"],
          ] as const).map(([k, label, ac, type]) => (
            <label key={k} className={k === "email" ? "sm:col-span-2" : ""}>
              <span className="eyebrow text-stone">{label}</span>
              <input type={type} autoComplete={ac} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="field" />
            </label>
          ))}
          {kind === "home" && (
            <label className="sm:col-span-2">
              <span className="eyebrow text-stone">Address for the home trial</span>
              <input autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" />
            </label>
          )}
          {kind === "video" && (
            <label className="sm:col-span-2">
              <span className="eyebrow text-stone">What would you like to talk about? (optional)</span>
              <textarea rows={2} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="field resize-none" placeholder="Back pain, sleeping hot, choosing for two…" />
            </label>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-[#9a5a4a]" role="alert">{error}</p>}
        <button type="submit" disabled={busy} aria-busy={busy} className="btn btn-gold mt-8 w-full sm:w-auto">
          {busy ? "Reserving…" : kind === "salon" ? "Request my visit" : kind === "home" ? "Request my home trial" : "Book my video call"}
        </button>
      </div>
    </form>
  );
}
