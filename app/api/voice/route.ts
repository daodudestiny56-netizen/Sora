import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyVoice } from "@/lib/sora/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  text: z.string().min(1).max(600),
  lang: z.enum(["en", "pcm", "yo", "ha", "ig"]),
});

/** Proxies to the YarnGPT2 voice service (services/voice) so the browser never sees its token. */
export async function POST(req: Request) {
  if (!process.env.VOICE_SERVICE_URL) return Response.json({ error: "Voice service is not configured." }, { status: 503 });
  if (!rateLimit(`voice:${clientIp(req)}`, 6, 60_000)) {
    return Response.json({ error: "Too many voice notes in a minute." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  return synthesize(parsed.data, "wav");
}

/**
 * Signed, expiring GET link used as WhatsApp media (WhatsApp fetches the URL itself).
 * MP3 because WhatsApp doesn't accept WAV.
 */
export async function GET(req: Request) {
  const secret = process.env.VOICE_SERVICE_TOKEN;
  if (!process.env.VOICE_SERVICE_URL || !secret) return new Response("not configured", { status: 503 });
  const ok = verifyVoice(new URL(req.url).searchParams, secret);
  if (!ok) return new Response("forbidden", { status: 403 });
  return synthesize(ok, "mp3");
}

async function synthesize(data: z.infer<typeof Body>, format: "wav" | "mp3") {
  const base = process.env.VOICE_SERVICE_URL!;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.VOICE_SERVICE_TOKEN && { Authorization: `Bearer ${process.env.VOICE_SERVICE_TOKEN}` }),
      },
      body: JSON.stringify({ ...data, format }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) return Response.json({ error: "Voice service failed." }, { status: 502 });
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? (format === "mp3" ? "audio/mpeg" : "audio/wav"),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Voice service is waking up or offline. Try again in a minute." }, { status: 504 });
  }
}
