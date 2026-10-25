import { after } from "next/server";
import { analyze, InputError } from "@/lib/sora/analyze";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Analysis } from "@/lib/sora/types";
import {
  WELCOME,
  fetchMedia,
  formatReply,
  isGreeting,
  parseIncoming,
  sendWhatsApp,
  signVoice,
  twilioCreds,
  twiml,
  validTwilioSignature,
} from "@/lib/sora/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 60;

const xml = (body: string) => new Response(body, { headers: { "Content-Type": "text/xml; charset=utf-8" } });

/** The URL Twilio signed: the public one, not the internal one behind Vercel's proxy. */
function publicUrl(req: Request): string {
  if (process.env.TWILIO_WEBHOOK_URL) return process.env.TWILIO_WEBHOOK_URL;
  const u = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? u.host;
  return `${proto}://${host}${u.pathname}${u.search}`;
}

/**
 * Twilio WhatsApp webhook. Set it as "When a message comes in" for the sandbox
 * or sender. With Twilio credentials set, we acknowledge at once and reply via
 * the REST API after the response, because Twilio waits only 15 s and reading a
 * screenshot with Gemma can take longer. Without credentials (local testing),
 * the reply is returned directly as TwiML.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return new Response("bad request", { status: 400 });
  const params: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string") params[k] = v;
  });

  const creds = twilioCreds();
  // Without Twilio keys the endpoint is unauthenticated, so protect the model quota.
  if (!creds && !rateLimit(`wa:${clientIp(req)}`, 10, 60_000)) return new Response("rate limited", { status: 429 });
  if (creds && !validTwilioSignature(creds.token, publicUrl(req), params, req.headers.get("x-twilio-signature") ?? "")) {
    return new Response("forbidden", { status: 403 });
  }

  const from = params.From ?? "";
  const body = (params.Body ?? "").slice(0, 1500);
  const numMedia = Number(params.NumMedia ?? "0");
  if (!numMedia && (!body.trim() || isGreeting(body))) return xml(twiml(WELCOME));

  const { lang, message } = parseIncoming(body);
  const origin = new URL(publicUrl(req)).origin;

  async function run(): Promise<{ text: string; voice?: string }> {
    let a: Analysis;
    try {
      const media = numMedia ? await fetchMedia(creds, params.MediaUrl0 ?? "") : null;
      if (numMedia && !media) return { text: "I can read photos and screenshots (PNG or JPG). For anything else, paste the text." };
      a = await analyze(
        { text: message || undefined, ...(media && { image: media }) },
        { languages: lang === "en" ? ["en"] : [lang, "en"], timeoutMs: 45_000 },
      );
    } catch (e) {
      return { text: e instanceof InputError ? e.message : "Sorry, something went wrong. Please paste the text and try again." };
    }
    const text = formatReply(a, lang);
    const exp = a.explanations[lang];
    const secret = process.env.VOICE_SERVICE_TOKEN;
    const voice =
      exp && process.env.VOICE_SERVICE_URL && secret
        ? `${origin}/api/voice?${signVoice([exp.summary, ...exp.actions].join(" ").slice(0, 600), lang, secret)}`
        : undefined;
    return { text, voice };
  }

  if (creds) {
    after(async () => {
      const r = await run();
      await sendWhatsApp(creds, from, r.text);
      if (r.voice) await sendWhatsApp(creds, from, "🔊", r.voice);
    });
    return xml(twiml());
  }
  const r = await run();
  return xml(twiml(r.text));
}
