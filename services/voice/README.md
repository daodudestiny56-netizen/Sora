# Ṣọ́ra voice service (YarnGPT2)

Turns Ṣọ́ra's explanations into Nigerian-accent voice notes in Yorùbá, Hausa, Igbo and English
(Pidgin is read by an English voice) using [YarnGPT2](https://huggingface.co/saheedniyi/YarnGPT2)
(Apache-2.0).

It is a separate service because the model needs PyTorch and about 2 GB of RAM, which doesn't fit
in a Vercel function. The web app calls it through `/api/voice`, so the token never reaches the browser.

## Deploy on a free Hugging Face Space
1. Create a Space → **Docker** → blank. Upload `Dockerfile`, `requirements.txt` and `app.py`.
2. In the Space settings, add a secret `VOICE_SERVICE_TOKEN` (any long random string).
3. Wait for the build, then open `https://<user>-<space>.hf.space/health`.
4. In Vercel (or `.env`), set `VOICE_SERVICE_URL=https://<user>-<space>.hf.space` and the same
   `VOICE_SERVICE_TOKEN`.

The free CPU tier works but is slow (a 3-sentence note can take 30–60 s) and sleeps when idle, so the
first request after a pause also waits for a cold start. Use a GPU Space for live demos, or play each
demo message once before presenting to fill the cache.

## Run locally
```bash
docker build -t sora-voice services/voice
docker run -p 7860:7860 -e VOICE_SERVICE_TOKEN=dev sora-voice
curl -X POST localhost:7860/tts -H "Authorization: Bearer dev" -H "Content-Type: application/json" \
  -d '{"text":"Ẹ ṣọ́ra o. Ọ̀rọ̀ yìí ní àwọn àmì ewu.","lang":"yo"}' -o note.wav
```

## Known limits (from the model card and our checks)
- Audio can sound rushed, and the model may not cover every accent.
- Yorùbá needs full tone marks in the input to be pronounced well. Ṣọ́ra's prompts ask Gemma for them.
- Not yet load-tested. Each request runs sentence by sentence with a small in-memory cache.
