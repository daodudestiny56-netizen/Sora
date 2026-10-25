"""
Ṣọ́ra voice service: turns an explanation into a Nigerian-accent voice note
with YarnGPT2 (Apache-2.0, https://huggingface.co/saheedniyi/YarnGPT2).

POST /tts {"text": "...", "lang": "yo"} -> audio/wav
GET  /health

Runs on CPU (slow, ~real-time or slower) or GPU. Designed for a Hugging Face
Docker Space; the web app reaches it through /api/voice so the token stays server-side.
"""
import hashlib
import io
import os
import re
from collections import OrderedDict

import torch
import torchaudio
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM
from yarngpt.audiotokenizer import AudioTokenizerV2

MODEL_ID = "saheedniyi/YarnGPT2"
MODELS_DIR = os.environ.get("MODELS_DIR", "/models")
WAV_CONFIG = f"{MODELS_DIR}/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
WAV_MODEL = f"{MODELS_DIR}/wavtokenizer_large_speech_320_24k.ckpt"
TOKEN = os.environ.get("VOICE_SERVICE_TOKEN", "")

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


def check_token(authorization: str = Header(default="")) -> None:
    if TOKEN and authorization != f"Bearer {TOKEN}":
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


@torch.inference_mode()
def synthesize(text: str, lang: str) -> bytes:
    language, speaker = VOICES[lang]
    clips = []
    for s in sentences(text):
        prompt = audio_tokenizer.create_prompt(s, lang=language, speaker_name=speaker)
        input_ids = audio_tokenizer.tokenize_prompt(prompt)
        output = model.generate(input_ids=input_ids, temperature=0.1, repetition_penalty=1.1, max_length=4000)
        clips.append(audio_tokenizer.get_audio(audio_tokenizer.get_codes(output)))
        clips.append(torch.zeros(1, 24000 // 4))  # short pause between sentences
    audio = torch.cat([c.reshape(1, -1).cpu() for c in clips], dim=1)
    buf = io.BytesIO()
    torchaudio.save(buf, audio, sample_rate=24000, format="wav")
    return buf.getvalue()


@app.get("/health")
def health():
    return {"ok": True, "device": str(audio_tokenizer.device), "voices": VOICES}


@app.post("/tts", dependencies=[Depends(check_token)])
def tts(req: TTSRequest):
    key = hashlib.sha256(f"{req.lang}:{req.text}".encode()).hexdigest()
    if key not in _cache:
        _cache[key] = synthesize(req.text, req.lang)
        if len(_cache) > 64:
            _cache.popitem(last=False)
    _cache.move_to_end(key)
    return Response(_cache[key], media_type="audio/wav")
