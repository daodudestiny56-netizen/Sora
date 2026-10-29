import type { Backend } from "./types";

export interface ImageInput {
  mimeType: string;
  /** Base64 without the data: prefix. */
  data: string;
}

export interface CompletionRequest {
  system: string;
  user: string;
  image?: ImageInput;
  maxTokens: number;
  timeoutMs: number;
}

export interface Provider {
  backend: Exclude<Backend, "rules">;
  model: string;
  complete(req: CompletionRequest): Promise<string>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

// Shared across requests on a warm instance: once a model rejects thinkingConfig, stop sending it.
let withThinking = true;

/** Gemma 4 served by Google's Gemini API (free tier with a Google AI Studio key). */
function gemini(apiKey: string, model: string): Provider {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  async function call(req: CompletionRequest, withThinkingConfig: boolean): Promise<Response> {
    const parts: object[] = [{ text: req.user }];
    if (req.image) parts.push({ inline_data: { mime_type: req.image.mimeType, data: req.image.data } });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(req.timeoutMs),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: req.maxTokens,
          // Classification + short writing doesn't need long reasoning; keep latency low.
          ...(withThinkingConfig && { thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING ?? "minimal" } }),
        },
      }),
    });
  }

  return {
    backend: "gemini",
    model,
    async complete(req) {
      let res = await call(req, withThinking);
      // Not every model accepts thinkingConfig; retry once without it and remember that for later retries.
      if (res.status === 400 && withThinking) {
        withThinking = false;
        res = await call(req, withThinking);
      }
      // The hosted API returns occasional transient 500/503s; two quick retries recover almost all of them.
      // Keep using the variant that worked, or a model that rejects thinkingConfig would 400 on every retry.
      for (let attempt = 1; attempt <= 2 && (res.status === 500 || res.status === 503); attempt++) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
        res = await call(req, withThinking);
      }
      if (!res.ok) throw new ProviderError(`Gemini API ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && p.text)
        .map((p) => p.text)
        .join("");
      if (!text) throw new ProviderError("Gemini API returned no text");
      return text;
    },
  };
}

/** Any OpenAI-compatible server: Ollama (`gemma4:e4b`), vLLM, llama.cpp, LM Studio, OpenRouter. */
function openaiCompatible(baseUrl: string, apiKey: string, model: string): Provider {
  return {
    backend: "openai",
    model,
    async complete(req) {
      const content: object[] = [{ type: "text", text: req.user }];
      if (req.image) {
        content.push({ type: "image_url", image_url: { url: `data:${req.image.mimeType};base64,${req.image.data}` } });
      }
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(req.timeoutMs),
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: req.maxTokens,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content },
          ],
        }),
      });
      if (!res.ok) throw new ProviderError(`${baseUrl} ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new ProviderError("Model returned no text");
      return text;
    },
  };
}

export function resolveBackend(requested?: Backend): Backend {
  const env = (requested ?? process.env.SORA_BACKEND)?.toLowerCase();
  if (env === "gemini" || env === "openai" || env === "rules") return env;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_BASE_URL) return "openai";
  return "rules";
}

export function getProvider(backend: Backend): Provider | null {
  if (backend === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new ProviderError("GEMINI_API_KEY is not set");
    return gemini(key, process.env.GEMINI_MODEL ?? "gemma-4-26b-a4b-it");
  }
  if (backend === "openai") {
    return openaiCompatible(
      process.env.OPENAI_BASE_URL ?? "http://localhost:11434/v1",
      process.env.OPENAI_API_KEY ?? "ollama",
      process.env.OPENAI_MODEL ?? "gemma4:e4b",
    );
  }
  return null;
}
