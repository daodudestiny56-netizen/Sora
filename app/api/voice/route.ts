import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  text: z.string().min(1).max(600),
  lang: z.enum(["en", "pcm", "yo", "ha", "ig"]),
});

/** Proxies to the YarnGPT2 voice service (services/voice) so the browser never sees its token. */
export async function POST(req: Request) {
  const base = process.env.VOICE_SERVICE_URL;
  if (!base) return Response.json({ error: "Voice service is not configured." }, { status: 503 });
  if (!rateLimit(`voice:${clientIp(req)}`, 6, 60_000)) {
    return Response.json({ error: "Too many voice notes in a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.VOICE_SERVICE_TOKEN && { Authorization: `Bearer ${process.env.VOICE_SERVICE_TOKEN}` }),
      },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) return Response.json({ error: "Voice service failed." }, { status: 502 });
    return new Response(res.body, {
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/wav", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Voice service is waking up or offline. Try again in a minute." }, { status: 504 });
  }
}
