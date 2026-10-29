"""
Ṣọ́ra voice service: turns an explanation into a Nigerian-accent voice note
with YarnGPT2 (Apache-2.0, https://huggingface.co/saheedniyi/YarnGPT2).

POST /tts {"text": "...", "lang": "yo"} -> audio/wav
GET  /health

Runs on CPU (slow, ~real-time or slower) or GPU. Designed for a Hugging Face
Docker Space; the web app reaches it through /api/voice so the token stays server-side.
"""
import hashlib
import hmac
import io
import os
import re
import subprocess
import wave
from collections import OrderedDict

import numpy as np
import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM

# The Dockerfile clones saheedniyi02/yarngpt to /opt/yarngpt and puts that folder on PYTHONPATH.
# audiotokenizer.py sits at the root of that repo, so it imports as a top-level module (there is no
# `yarngpt.audiotokenizer` there; the `yarngpt` package in python-wrapper/ is a different wrapper).
from audiotokenizer import AudioTokenizerV2

MODEL_ID = "saheedniyi/YarnGPT2"
MODELS_DIR = os.environ.get("MODELS_DIR", "/models")
WAV_CONFIG = f"{MODELS_DIR}/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
WAV_MODEL = f"{MODELS_DIR}/wavtokenizer_large_speech_320_24k.ckpt"
TOKEN = os.environ.get("VOICE_SERVICE_TOKEN", "")
if not TOKEN:
    # Synthesis is CPU-heavy: an open endpoint can be tied up by anyone. Refuse to run without a token.
    raise SystemExit("Set VOICE_SERVICE_TOKEN before starting the voice service.")

# YarnGPT2 has no Pidgin voice; a Nigerian-accent English voice reads Pidgin naturally enough.
VOICES = {
    "en": ("english", os.environ.get("VOICE_EN", "idera")),
    "pcm": ("english", os.environ.get("VOICE_PCM", "jude")),
    "yo": ("yoruba", os.environ.get("VOICE_YO", "yoruba_female2")),
    "ha": ("hausa", os.environ.get("VOICE_HA", "hausa_female1")),
    "ig": ("igbo", os.environ.get("VOICE_IG", "igbo_female2")),
}

audio_tokenizer = AudioTokenizerV2(MODEL_ID, WAV_MODEL, WAV_CONFIG)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype="auto").to(audio_tokenizer.device)
model.eval()

app = FastAPI(title="Ṣọ́ra voice")
_cache: "OrderedDict[str, bytes]" = OrderedDict()


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    lang: str = Field(pattern="^(en|pcm|yo|ha|ig)$")
    # WhatsApp needs a compressed format; the web player uses WAV.
    format: str = Field(default="wav", pattern="^(wav|mp3)$")


def check_token(authorization: str = Header(default="")) -> None:
    if not hmac.compare_digest(authorization.encode(), f"Bearer {TOKEN}".encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


def sentences(text: str, max_len: int = 220) -> list[str]:
    """YarnGPT2 degrades on long inputs, so speak sentence by sentence."""
    parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", text) if p.strip()]
    out: list[str] = []
    for p in parts:
        while len(p) > max_len:
            cut = p.rfind(",", 0, max_len)
            cut = cut if cut > 40 else max_len
            out.append(p[:cut].strip())
            p = p[cut:].lstrip(", ")
        out.append(p)
    return out[:8]


SAMPLE_RATE = 24000


def encode_wav(samples: np.ndarray) -> bytes:
    """16-bit mono WAV using only the standard library (no dependency on torchaudio's save backends)."""
    pcm = (np.clip(samples.reshape(-1), -1.0, 1.0) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def wav_to_mp3(wav: bytes) -> bytes:
    """WhatsApp accepts MP3 but not WAV. Convert with the ffmpeg that the Docker image installs."""
    done = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "wav", "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "64k", "-f", "mp3", "pipe:1"],
        input=wav,
        capture_output=True,
        timeout=30,
    )
    if done.returncode != 0 or not done.stdout:
        raise RuntimeError(f"ffmpeg failed: {done.stderr.decode(errors='replace')[:200]}")
    return done.stdout


@torch.inference_mode()
def synthesize(text: str, lang: str, fmt: str = "wav") -> bytes:
    language, speaker = VOICES[lang]
    clips = []
    for s in sentences(text):
        prompt = audio_tokenizer.create_prompt(s, lang=language, speaker_name=speaker)
        input_ids = audio_tokenizer.tokenize_prompt(prompt)
        output = model.generate(input_ids=input_ids, temperature=0.1, repetition_penalty=1.1, max_length=4000)
        clips.append(audio_tokenizer.get_audio(audio_tokenizer.get_codes(output)))
        clips.append(torch.zeros(1, SAMPLE_RATE // 4))  # short pause between sentences
    audio = torch.cat([c.reshape(1, -1).cpu().float() for c in clips], dim=1)
    wav = encode_wav(audio.numpy())
    return wav_to_mp3(wav) if fmt == "mp3" else wav


@app.get("/health")
def health():
    return {"ok": True, "device": str(audio_tokenizer.device), "voices": VOICES}


@app.post("/tts", dependencies=[Depends(check_token)])
def tts(req: TTSRequest):
    key = hashlib.sha256(f"{req.lang}:{req.format}:{req.text}".encode()).hexdigest()
    if key not in _cache:
        _cache[key] = synthesize(req.text, req.lang, req.format)
        if len(_cache) > 64:
            _cache.popitem(last=False)
    _cache.move_to_end(key)
    return Response(_cache[key], media_type="audio/mpeg" if req.format == "mp3" else "audio/wav")
