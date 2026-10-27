# Ṣọ́ra voice service (YarnGPT2)

Turns Ṣọ́ra's explanations into Nigerian-accent voice notes in Yorùbá, Hausa, Igbo and English
(Pidgin is read by an English voice) using [YarnGPT2](https://huggingface.co/saheedniyi/YarnGPT2)
(Apache-2.0).

It is a separate service because the model needs PyTorch and about 2 GB of RAM, which doesn't fit
in a Vercel function. The web app calls it through `/api/voice`, so the token never reaches the browser.

## Hosting
Any host that runs a Docker container with about 2 GB of RAM works. As of October 2026 Hugging Face
**no longer offers Docker Spaces on the free plan** (they need PRO), so a free Space is not an option.
Hugging Face PRO, a small VPS or a cloud container service all work. The steps below use a Space.

## Deploy on a Hugging Face Space (needs PRO)
1. Create a Space → **Docker** → blank. Upload `Dockerfile`, `requirements.txt` and `app.py`.
2. In the Space settings, add a secret `VOICE_SERVICE_TOKEN` (any long random string).
3. Wait for the build, then open `https://<user>-<space>.hf.space/health`.
4. In Vercel (or `.env`), set `VOICE_SERVICE_URL=https://<user>-<space>.hf.space` and the same
   `VOICE_SERVICE_TOKEN`.

The free CPU tier works but is slow (a 3-sentence note can take 30–60 s) and sleeps when idle, so the
first request after a pause also waits for a cold start. Use a GPU Space for live demos, or play each
demo message once before presenting to fill the cache.

## Check it after deploying
Replace `$URL` and `$TOKEN`. Each call should return audio; the first one is slow because the model loads.
```bash
curl $URL/health                                   # {"ok":true,"device":"cpu",...}
for L in en yo ha ig; do
  curl -s -X POST $URL/tts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"text":"Ẹ ṣọ́ra o. Ọ̀rọ̀ yìí ní àwọn àmì ewu.","lang":"'$L'","format":"mp3"}' -o note_$L.mp3
done
file note_*.mp3                                    # each should say "MPEG ... layer III"
```
If the Space logs show `ModuleNotFoundError`, check that the build finished and that `PYTHONPATH=/opt/yarngpt`
is set (the Dockerfile sets it).

## Run locally
```bash
docker build -t sora-voice services/voice
docker run -p 7860:7860 -e VOICE_SERVICE_TOKEN=dev sora-voice
curl -X POST localhost:7860/tts -H "Authorization: Bearer dev" -H "Content-Type: application/json" \
  -d '{"text":"Ẹ ṣọ́ra o. Ọ̀rọ̀ yìí ní àwọn àmì ewu.","lang":"yo"}' -o note.wav
```

## What we have checked
On 27 Oct 2026 the image was built and run on a Windows PC with Docker Desktop (CPU only). `/health`
returned `ok`, and `/tts` returned MP3 files for `en`, `yo`, `ha` and `ig`. A team member listened to a
short Hausa and a short Igbo sentence: both sounded like the right language, with slightly uneven
spacing. This is a quick listen, not a native-speaker review.

Build notes: the first build took about an hour and a half on a slow connection, mostly downloading
PyTorch. The WavTokenizer checkpoint is fetched from Google Drive with `gdown` (the Hugging Face link
returns 404), and `build-essential` is needed to compile `pesq`.

## Known limits (from the model card and our checks)
- Audio can sound rushed, and the model may not cover every accent.
- The helper's text front end (`process_text` in yarngpt's `audiotokenizer.py`) romanizes the input and keeps only
  plain a-z letters, so tone marks and dot-below letters are dropped before synthesis. Tone marks in the text do
  not change the audio. This comes from reading the code, not from listening, so a native speaker should judge
  how the Yorùbá, Hausa and Igbo voices sound.
- Not yet load-tested. Each request runs sentence by sentence with a small in-memory cache.
