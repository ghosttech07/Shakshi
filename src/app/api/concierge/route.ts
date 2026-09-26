import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE, guideReply } from "@/lib/concierge-knowledge";

export const runtime = "nodejs";

const SYSTEM = `You are the Shakshi Sleep Concierge, the voice of a luxury mattress atelier. You help guests choose a mattress and answer questions about products, delivery, the trial, warranty, payment and showrooms.

Voice: calm, warm, confident and brief, like a concierge at a fine hotel. Speak to feelings first (weightless, cocooned, restored), then support with a detail. Keep replies to 2–4 short sentences unless the guest asks for detail. Use **bold** for mattress names. You may link to site pages with markdown links such as [Sleep Quiz](/quiz). Never use headings, bullet lists or emoji.

Only state facts found in the reference below. If you don't know something (for example, a specific order's status), say so kindly and offer the phone line or WhatsApp. Never invent discounts, prices or policies. When recommending, ask about sleep position, temperature and whether they share the bed if you don't yet know.

REFERENCE
${KNOWLEDGE}`;

type ChatMessage = { role: "user" | "assistant"; content: string };

const encoder = new TextEncoder();

/** Streams a canned reply word-by-word so the offline guide feels the same as the live one. */
function streamText(text: string) {
  const words = text.split(/(\s+)/);
  return new ReadableStream({
    async start(controller) {
      for (const w of words) {
        controller.enqueue(encoder.encode(w));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
}

const hasCredentials = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter(
        (m: unknown): m is ChatMessage =>
          typeof m === "object" && m !== null &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string"
      )
      .slice(-12)
      .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  // The conversation must start and end with the guest.
  while (messages.length && messages[0].role !== "user") messages.shift();
  const last = messages.at(-1);
  if (!last || last.role !== "user") return new Response("Bad request", { status: 400 });

  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

  if (!hasCredentials()) {
    return new Response(streamText(guideReply(last.content)), { headers: { ...headers, "X-Concierge": "guide" } });
  }

  const client = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      let sent = false;
      try {
        const response = client.beta.messages.stream({
          model: "claude-opus-5",
          max_tokens: 4096,
          system: SYSTEM,
          messages,
          // Chat is latency-sensitive; short concierge answers do well at low effort.
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"],
          // On a policy decline, re-run on Anthropic's recommended fallback model
          fallbacks: "default",
        });
        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
            sent = true;
          }
        }
        const final = await response.finalMessage();
        if (final.stop_reason === "refusal" && !sent) {
          controller.enqueue(encoder.encode(guideReply(last.content)));
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) console.warn("[concierge] rate limited");
        else if (error instanceof Anthropic.APIError) console.error("[concierge] API error", error.status, error.message);
        else console.error("[concierge]", error);
        // Degrade gracefully to the built-in guide rather than leaving the guest hanging.
        if (!sent) controller.enqueue(encoder.encode(guideReply(last.content)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { ...headers, "X-Concierge": "live" } });
}
