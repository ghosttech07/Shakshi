"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api } from "./actions";

/** The atelier's public reply beneath a review (shown once the review is approved). */
export function ReplyForm({ id, reply }: { id: string; reply?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  if (!open) {
    return (
      <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(true)}>
        {reply ? "Edit reply" : "Reply"}
      </button>
    );
  }
  return (
    <div className="w-full">
      <label htmlFor={`reply-${id}`} className="label">
        Public reply from Shakshi
      </label>
      <textarea id={`reply-${id}`} className="field" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="btn btn-dark btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await api("PATCH", `/api/admin/records/reviews/${id}`, { reply: text.trim() });
                setOpen(false);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            })
          }
        >
          {pending ? "Saving…" : text.trim() ? "Save reply" : "Remove reply"}
        </button>
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}
