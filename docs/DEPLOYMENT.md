# Deploying Ṣọ́ra

Ṣọ́ra has four parts. Only the first is required. Each extra part switches on a feature, and without
it the app degrades gracefully.

| Part | Host | Without it |
|---|---|---|
| Web app + API | Vercel | n/a (required) |
| Reasoning model (Gemma 4) | Gemini API, or your own server | Rules + templates only; no screenshots |
| Voice model (YarnGPT2) | Hugging Face Docker Space | Device voice for English/Pidgin only |
| Phone channels | Africa's Talking | Simulator on the website still works |

## 1. Web app on Vercel
```bash
npm i -g vercel
vercel link
vercel env add GEMINI_API_KEY production       # free key from https://aistudio.google.com/apikey
vercel --prod
```
API routes run as Node.js serverless functions (`maxDuration` 60 s for `/api/analyze`). Screenshots are
resized in the browser to stay under Vercel's 4.5 MB request limit.

## 2. Gemma 4
**Hosted (default for the demo):** the Gemini API serves `gemma-4-26b-a4b-it` and `gemma-4-31b-it`.
Set `GEMINI_API_KEY`, and optionally `GEMINI_MODEL`. The free tier is rate-limited, so the app limits
each IP to 12 checks a minute and falls back to rules when the model fails.

**Self-hosted (full control, no data leaves your server):**
```bash
# Laptop / small server: Gemma 4 E4B with Ollama
ollama pull gemma4:e4b && ollama serve
# GPU server: vLLM with an OpenAI-compatible API
vllm serve google/gemma-4-E4B-it --port 8000
```
Then set `SORA_BACKEND=openai`, `OPENAI_BASE_URL=http://<host>:<port>/v1` and `OPENAI_MODEL=<name>`.
Vercel functions can call it if it has a public HTTPS URL.

## 3. Voice notes (YarnGPT2)
See [`services/voice/README.md`](../services/voice/README.md). Deploy the Docker image to a Hugging Face
Space, then set `VOICE_SERVICE_URL` and `VOICE_SERVICE_TOKEN` in Vercel.

## 4. Phone channels (Africa's Talking)
See [FEATURE_PHONES.md](FEATURE_PHONES.md).

## Environment variables
See [`.env.example`](../.env.example). Never commit `.env`; it is git-ignored.
