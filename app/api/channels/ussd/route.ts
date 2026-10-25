import { handleUssd } from "@/lib/sora/channels";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * Africa's Talking USSD callback. Register this URL as the service callback.
 * Also used by the feature-phone simulator on the website (JSON body).
 */
export async function POST(req: Request) {
  if (!rateLimit(`ussd:${clientIp(req)}`, 40, 60_000)) return new Response("END Too many requests. Try again later.", { status: 200 });
  const type = req.headers.get("content-type") ?? "";
  let text = "";
  if (type.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { text?: unknown };
    text = typeof body.text === "string" ? body.text : "";
  } else {
    const form = await req.formData().catch(() => null);
    text = String(form?.get("text") ?? "");
  }
  const reply = await handleUssd(text.slice(0, 500), process.env.SORA_SMS_NUMBER || "the Sora SMS number");
  return new Response(reply, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
