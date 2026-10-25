# 03 — PRD: Ṣọ́ra

> *Ṣọ́ra* (Yorùbá): "be careful". Always write it with tone marks, because "Sora" clashes with OpenAI's video model.

## 1. Problem
Nigerian families receive a steady stream of scam messages: fake "BVN blocked" texts, lookalike bank sender IDs, fake credit alerts, "this is my new number" WhatsApp messages, fake government grants. The people most at risk, often older parents, may read English slowly, trust official-looking messages, and have nobody to ask in the moment. Their children (us) end up as the family's fraud desk, usually *after* the money is gone.

Existing tools (carrier spam filters) label a message at best. They don't say *why*, don't cover WhatsApp or screenshots, and don't speak Yorùbá or Pidgin.

## 2. Users
- **Primary: the "family tech support" student.** 18–25, smartphone, WhatsApp-native, forwards suspicious messages and wants a clear answer to pass on.
- **Secondary: the parent/grandparent.** Yorùbá-first or Pidgin-comfortable, prefers voice notes, low patience for long text.
- **Scenario:** Mum forwards a screenshot asking "Is this true?" → the student pastes it into Ṣọ́ra → sends back the Yorùbá voice note within a minute.

## 3. Goals / non-goals
**Goals (prototype)**
1. Give a verdict on a pasted message or screenshot: **Likely scam / Suspicious / No red flags found**.
2. Highlight the exact phrases that triggered each red flag, with a one-line reason.
3. Give 1–3 concrete "what to do" steps (e.g. "Check your balance in your bank app, not the SMS").
4. Explain in **English, Nigerian Pidgin and Yorùbá**.
5. Produce a **Yorùbá voice note** (downloadable audio, ≤45 s).
6. Publish an eval showing how well it works and why we chose the model.

**Non-goals:** real-time interception of SMS; WhatsApp Business API integration; checking bank transactions; Hausa/Igbo (listed as future work); calling anything "safe".

## 4. User stories
- As a student, I paste a text or upload a screenshot and get a verdict in under ~15 s.
- As a student, I see *which words* are suspicious so I can trust the verdict.
- As a parent, I hear a calm Yorùbá explanation and what to do next.
- As a judge or developer, I can run the eval with one command and get the same numbers.

## 5. Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| F1 | Text input box (paste SMS/WhatsApp text) | P0 |
| F2 | Image upload (screenshot) → text extraction by the model | P0 |
| F3 | Rules engine: OTP/PIN/BVN/password request, lookalike sender IDs, non-bank URLs/shorteners, urgency words, "new number" pattern, fee-before-reward | P0 |
| F4 | Model verdict + red flags, each **quoting an exact phrase** from the input (structured JSON) | P0 |
| F5 | Merge logic: a high-severity rule hit can never be downgraded to "No red flags found" by the model | P0 |
| F6 | Explanations in EN / Pidgin / Yorùbá | P0 |
| F7 | Yorùbá TTS voice note + download button | P1 |
| F8 | Eval script + dataset + results table in README | P0 |
| F9 | "Share to WhatsApp" button (wa.me link with text summary) | P2 |
| F10 | Voice input (parent speaks the message) | P3 / future |

## 6. Architecture
```
 text / screenshot
        │
        ▼
 ┌──────────────┐   if image   ┌──────────────────────────┐
 │  Input layer │─────────────▶│ Gemma 4 E4B: OCR/extract │
 └──────┬───────┘              └────────────┬─────────────┘
        │ text                              │ text
        ▼                                   ▼
 ┌─────────────────────────────────────────────────────┐
 │ Rules engine (Python, regex + lists)                │  → hard flags + severity
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────────────┐
 │ Gemma 4 E4B reasoning prompt (JSON out):            │
 │ verdict, red_flags[{quote, reason}], actions[],     │
 │ explanation_en, explanation_pcm, explanation_yo     │
 └──────────────────────┬──────────────────────────────┘
                        ▼
 ┌──────────────────┐     ┌────────────────────────────┐
 │ Merge + validate │────▶│ YarnGPT2 Yorùbá TTS → .wav │
 │ (quotes must     │     └────────────────────────────┘
 │  exist in input) │
 └────────┬─────────┘
          ▼
   Gradio web UI (verdict card, highlights, 3 tabs, audio player)
```

**Stack:** Python 3.11 · Gradio · Ollama (local Gemma 4 E4B) behind an OpenAI-compatible client so the backend can be swapped for a hosted provider · YarnGPT2 via transformers · pytest.

**Backend switch:** `SORA_BACKEND=ollama|hosted` in `.env` (never committed; ship `.env.example`).

**Grounding check:** every red-flag `quote` must be a substring of the input (fuzzy match for OCR). Drop flags that fail and log them. This stops invented evidence.

## 7. Model choices (to be confirmed by Day-2 eval)
| Role | Choice | Why | Alternatives tested |
|---|---|---|---|
| Reasoning + OCR | **Gemma 4 E4B** | Apache 2.0, reads images, small enough for a laptop, 140+ languages | N-ATLaS 8B (Nigerian languages, but custom licence, weakest in Yorùbá per its own card, no image input); Qwen |
| Yorùbá TTS | **YarnGPT2** | Apache 2.0, Nigerian voices | MMS-TTS-yor (non-commercial) |

## 8. Evaluation plan
- **Dataset `data/eval.jsonl`, about 150–200 items:** about 60% scam, 40% **legitimate** (real bank debit/credit alerts, OTP messages *we requested*, delivery notices). Fields: `text`, `label`, `scam_type`, `source` (public-warning / own-phone-anonymised / written-by-us-based-on-pattern).
- **Anonymise:** replace names, account numbers and phone numbers with placeholders. Never include real people's private data.
- **Metrics:** accuracy, **scam recall** (missed scams are the worst failure), **false-alarm rate on legit messages**, grounding rate (% of quotes found in the input), latency.
- **Yorùbá quality:** a native speaker rates 30 explanations 1–5 for correctness and naturalness; report this as a human rating, not a benchmark.
- **Comparison:** Gemma 4 E4B (± rules) vs N-ATLaS vs Qwen on the same set. Report it honestly even if Gemma loses on some metric.

## 9. Safety & honesty
- Never output "safe". The lowest verdict is "No red flags found — still confirm with your bank directly."
- Visible disclaimer: prototype, may be wrong, not affiliated with any bank, CBN or EFCC.
- Don't store submitted messages (process in memory only). Say this in the UI.
- Report the false-alarm rate and the missed-scam rate in the README.

## 10. Success criteria for submission
- Live demo link works, or the local run is reproducible with one command.
- Scam recall ≥ 85% and legit false-alarm rate ≤ 20% on our eval (targets, not promises).
- Yorùbá voice note plays for all 3 demo messages.
- README covers every item in the submission form.

## 11. Future work (for the "next steps" slide)
WhatsApp bot · Hausa and Igbo · voice input from parents · community-reported scam feed · offline Android app with Gemma 4 E2B.
