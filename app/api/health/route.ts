import { resolveBackend } from "@/lib/sora/providers";

export const dynamic = "force-dynamic";

export function GET() {
  const backend = resolveBackend();
  const model =
    backend === "gemini"
      ? (process.env.GEMINI_MODEL ?? "gemma-4-26b-a4b-it")
      : backend === "openai"
        ? (process.env.OPENAI_MODEL ?? "gemma4:e4b")
        : null;
  return Response.json({ backend, model, voice: Boolean(process.env.VOICE_SERVICE_URL), sms: Boolean(process.env.AT_API_KEY) });
}
