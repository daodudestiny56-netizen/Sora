# Hugging Face Docker Space (or any container host) for YarnGPT2 voice notes.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends git wget ffmpeg && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 user
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# YarnGPT helper code (audio tokenizer) and the WavTokenizer weights the model card points to.
RUN git clone --depth 1 https://github.com/saheedniyi02/yarngpt.git /opt/yarngpt
ENV PYTHONPATH=/opt/yarngpt MODELS_DIR=/models HF_HOME=/home/user/.cache/huggingface
RUN mkdir -p /models && \
    wget -q -O /models/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml \
      https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml && \
    wget -q -O /models/wavtokenizer_large_speech_320_24k.ckpt \
      https://huggingface.co/novateur/WavTokenizer-large-speech-75token/resolve/main/wavtokenizer_large_speech_320_24k.ckpt && \
    chown -R user /models

COPY --chown=user app.py .
USER user
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
