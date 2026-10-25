import { createHmac, timingSafeEqual } from "node:crypto";
import { parseSmsLanguage } from "./channels";
import type { Analysis, Lang, Verdict } from "./types";

/**
 * WhatsApp channel through Twilio (sandbox for testing, approved sender for production).
 * WhatsApp shows Unicode and longer text, so unlike SMS the reply keeps full tone marks.
 */

const LABEL: Record<Lang, Record<Verdict, string>> = {
  en: { likely_scam: "Likely scam", suspicious: "Suspicious", no_red_flags: "No red flags found" },
  pcm: { likely_scam: "E fit be scam", suspicious: "Shine your eye", no_red_flags: "We no see red flag" },
  yo: { likely_scam: "Ó ṣeé ṣe kó jẹ́ jìbìtì", suspicious: "Ẹ ṣọ́ra", no_red_flags: "A kò rí àmì ewu" },
  ha: { likely_scam: "Mai yiwuwa damfara ce", suspicious: "Ku yi hankali", no_red_flags: "Ba mu ga alamar haɗari ba" },
  ig: { likely_scam: "O nwere ike ịbụ aghụghọ", suspicious: "Kpachara anya", no_red_flags: "Anyị ahụghị ihe ịdọ aka ná ntị" },
};

const ICON: Record<Verdict, string> = { likely_scam: "🔴", suspicious: "🟠", no_red_flags: "🟢" };

const TODO: Record<Lang, string> = { en: "What to do", pcm: "Wetin to do", yo: "Ohun tí ẹ máa ṣe", ha: "Abin da za ku yi", ig: "Ihe ị ga-eme" };
const FLAGS: Record<Lang, string> = { en: "Red flags", pcm: "Wahala signs", yo: "Àwọn àmì ewu", ha: "Alamun haɗari", ig: "Ihe ịdọ aka ná ntị" };

export const WELCOME = `👋 *Ṣọ́ra* checks suspicious messages.

Forward or paste the message here, or send a screenshot. To get the answer in another language, start with *YO* (Yorùbá), *HA* (Hausa), *IG* (Igbo) or *PCM* (Pidgin).

_Ṣọ́ra is a free prototype and can be wrong. It is not your bank. Messages are not stored._`;

export const FOOTER =
  "_Reply with YO, HA, IG or PCM before a message for another language. Ṣọ́ra can be wrong: always confirm with your bank._";

export function formatReply(a: Analysis, lang: Lang): string {
  const exp = a.explanations[lang] ?? a.explanations.en!;
  const lines = [`${ICON[a.verdict]} *Ṣọ́ra: ${LABEL[lang][a.verdict]}*`, "", exp.summary];
  if (exp.actions.length) lines.push("", `*${TODO[lang]}:*`, ...exp.actions.map((x, i) => `${i + 1}. ${x}`));
  const quotes = a.redFlags.slice(0, 3).map((f) => `• “${f.quote}”`);
  if (quotes.length) lines.push("", `*${FLAGS[lang]}:*`, ...quotes);
  lines.push("", FOOTER);
  return lines.join("\n");
}

export function isGreeting(body: string): boolean {
  return /^(hi|hello|hey|help|start|menu|bawo|sannu|ndewo|good (morning|afternoon|evening))\b[\s!.]*$/i.test(body.trim());
}

export function parseIncoming(body: string): { lang: Lang; message: string } {
  return parseSmsLanguage(body);
}

/**
 * Twilio request signature: base64(HMAC-SHA1(authToken, url + sorted(key + value)...)).
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function validTwilioSignature(authToken: string, url: string, params: Record<string, string>, signature: string): boolean {
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const twiml = (message?: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${escapeXml(message)}</Message>` : ""}</Response>`;

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface TwilioCreds {
  sid: string;
  token: string;
  from: string;
}

export function twilioCreds(): TwilioCreds | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  return sid && token && from ? { sid, token, from } : null;
}

export async function sendWhatsApp(c: TwilioCreds, to: string, body: string, mediaUrl?: string): Promise<void> {
  const form = new URLSearchParams({ From: c.from, To: to, Body: body.slice(0, 1600) });
  if (mediaUrl) form.set("MediaUrl", mediaUrl);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${c.sid}:${c.token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error("twilio send failed:", res.status);
}

/** Download a WhatsApp image (Twilio media URLs need the account credentials). */
export async function fetchMedia(c: TwilioCreds | null, url: string): Promise<{ mimeType: string; data: string } | null> {
  const res = await fetch(url, {
    headers: c ? { Authorization: `Basic ${Buffer.from(`${c.sid}:${c.token}`).toString("base64")}` } : {},
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  if (!/^image\/(png|jpe?g|webp)/.test(mimeType)) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5_000_000) return null;
  return { mimeType, data: buf.toString("base64") };
}

/** Signed, expiring link to a voice note so WhatsApp can fetch it as media. */
export function signVoice(text: string, lang: Lang, secret: string, ttlSec = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = createHmac("sha256", secret).update(`${lang}|${exp}|${text}`).digest("base64url");
  return new URLSearchParams({ t: text, l: lang, e: String(exp), s: sig }).toString();
}

export function verifyVoice(q: URLSearchParams, secret: string): { text: string; lang: Lang } | null {
  const text = q.get("t") ?? "";
  const lang = q.get("l") as Lang;
  const exp = Number(q.get("e"));
  const sig = q.get("s") ?? "";
  if (!text || !lang || !exp || exp < Date.now() / 1000) return null;
  const expected = createHmac("sha256", secret).update(`${lang}|${exp}|${text}`).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b) ? { text, lang } : null;
}
