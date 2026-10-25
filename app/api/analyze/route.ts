import { z } from "zod";
import { analyze, InputError, MAX_TEXT } from "@/lib/sora/analyze";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { LANGS } from "@/lib/sora/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  text: z.string().max(MAX_TEXT * 2).optional(),
  /** data:image/...;base64,... — resized in the browser to keep under Vercel's 4.5 MB body limit. */
  image: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,/)
    .max(4_000_000)
    .optional(),
  languages: z.array(z.enum(LANGS)).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(clientIp(req), 12, 60_000)) {
    return Response.json({ error: "Too many checks in a minute. Wait a moment and try again." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const { text, image, languages } = parsed.data;
  const img = image?.match(/^data:(image\/[a-z]+);base64,(.*)$/);
  try {
    // Messages are processed in memory only and never stored or logged.
    const result = await analyze(
      { text, ...(img && { image: { mimeType: img[1], data: img[2] } }) },
      { languages },
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof InputError) return Response.json({ error: e.message }, { status: 422 });
    console.error("analyze failed:", (e as Error).message);
    return Response.json({ error: "Something went wrong reading that. Try pasting the text instead." }, { status: 502 });
  }
}
