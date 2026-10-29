import { handleSms, sendSms } from "@/lib/sora/channels";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Africa's Talking inbound SMS callback (form fields: from, to, text, date, id).
 * The reply is sent back through the AT messaging API when AT_API_KEY is set,
 * and always returned in the JSON body so the website simulator can show it.
 */
export async function POST(req: Request) {
  if (!rateLimit(`sms:${clientIp(req)}`, 20, 60_000)) return Response.json({ error: "rate limited" }, { status: 429 });
  const type = req.headers.get("content-type") ?? "";
  let from = "";
  let text = "";
  if (type.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { from?: unknown; text?: unknown };
    from = typeof body.from === "string" ? body.from : "";
    text = typeof body.text === "string" ? body.text : "";
  } else {
    const form = await req.formData().catch(() => null);
    from = String(form?.get("from") ?? "");
    text = String(form?.get("text") ?? "");
  }
  const { lang, reply } = await handleSms(text.slice(0, 1000));
  // Only reply by SMS to genuine Africa's Talking callbacks: the callback URL carries ?secret=AT_WEBHOOK_SECRET.
  // Otherwise anyone could make us text any number at our cost. The website simulator just reads `reply`.
  const secret = process.env.AT_WEBHOOK_SECRET;
  const fromAT = !!secret && new URL(req.url).searchParams.get("secret") === secret && !type.includes("application/json");
  const sent = fromAT && from ? await sendSms(from, reply).catch(() => false) : false;
  return Response.json({ lang, reply, sent });
}
