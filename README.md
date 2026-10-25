# Ṣọ́ra: check a message before you send money

> *Ṣọ́ra* (Yorùbá): “be careful.” Written with tone marks so it isn't confused with other products named “Sora”.

Ṣọ́ra checks a suspicious SMS, WhatsApp message or screenshot, **points at the exact words that give
the scam away**, and tells the person what to do in **English, Nigerian Pidgin, Yorùbá, Hausa or Igbo**,
with a voice note they can play. People without smartphones can use it by **USSD or by forwarding the
SMS**. It runs on **Gemma 4**, an open-weight model under Apache 2.0.

Built for **OPEN//BUILD 2026** (OSCA Ile-Ife Hacktoberfest).

| | |
|---|---|
| **Live demo** | _add Vercel URL after deploy_ |
| **Demo video** | _add link_ |
| **Run locally** | [Setup](#7-setup-run-test-reproduce): `npm install && npm run dev` |
| **Licence** | Code: Apache-2.0 · Eval data: CC BY 4.0 |

---

## Contents
1. [Team](#1-team)
2. [Problem statement](#2-problem-statement)
3. [Intended users](#3-intended-users)
4. [Solution](#4-solution)
5. [Model information](#5-model-information)
6. [Architecture and technical decisions](#6-architecture-and-technical-decisions)
7. [Setup, run, test, reproduce](#7-setup-run-test-reproduce)
8. [Evaluation](#8-evaluation)
9. [Button phones: USSD and SMS](#9-button-phones-ussd-and-sms)
10. [Deployment](#10-deployment)
11. [Limitations, safety and privacy](#11-limitations-safety-and-privacy)
12. [Project structure](#12-project-structure)
13. [Contributing](#13-contributing)
14. [Acknowledgements](#14-acknowledgements)
15. [Next steps](#15-next-steps)

---

## 1. Team
| Name | University | Role |
|---|---|---|
| _Full name_ | _University_ | Model, eval, backend |
| _Full name_ | _University_ | Data, UI, docs, demo |

## 2. Problem statement
Nigerian families get a steady stream of scam messages: "your BVN is blocked, click to verify",
lookalike bank sender IDs, fake credit alerts followed by "I sent it by mistake, please refund", "this is
my new number" requests, and fake government grants that need a "registration fee". The people most
at risk, often older parents, may read English slowly, trust official-looking messages, and have nobody
to ask in the moment. Many use button phones. Their children end up as the family's fraud desk, usually
after the money is gone.

Existing tools (carrier spam filters) label a message at best. They don't say **why**, don't cover WhatsApp
or screenshots, don't speak Yorùbá, Hausa, Igbo or Pidgin, and don't help people without smartphones.

## 3. Intended users
- **The "family tech support" student** (18–25, smartphone, WhatsApp-native). Pastes the message or
  screenshot a parent forwarded and sends back a clear answer or a voice note.
- **The parent or grandparent.** Yorùbá-, Hausa-, Igbo- or Pidgin-first, prefers voice notes, may only
  have a button phone. Dials the USSD code or forwards the SMS and gets a reply in their language.
- **Scenario:** Mum forwards a screenshot asking “Is this true?” → the student drops it into Ṣọ́ra →
  within seconds they have a verdict, the highlighted red flags, and a Yorùbá voice note to send back.

## 4. Solution
| Feature | What it does |
|---|---|
| **Verdict** | *Likely scam*, *Suspicious*, or *No red flags found*. Never “safe”. |
| **Evidence highlights** | Each red flag quotes the exact phrase from the message, highlighted in place, with a one-line reason. |
| **What to do** | 1–3 concrete steps, e.g. “Check your balance in your bank app, not the SMS.” |
| **Five languages** | English, Pidgin, Yorùbá, Hausa and Igbo, with full tone marks on the web. |
| **Screenshots** | Gemma 4 reads text from screenshots (sender ID, links, amounts). Without a model, or if the model fails, Tesseract.js reads them **on the device**, so the image never leaves the phone. |
| **Voice notes** | YarnGPT2 Nigerian-accent TTS. Download or share. |
| **Share to WhatsApp** | One tap sends the explanation to family. |
| **Button phones** | USSD menu and SMS forwarding, same engine, replies sized for 2G screens. |
| **Works without the model** | If the model is unreachable, deterministic rules and hand-written translations still answer. |

## 5. Model information

### Gemma 4: the reasoning and reading model
| | |
|---|---|
| **Role** | (1) Reads screenshots (OCR). (2) Judges whether a message is a scam using context. (3) Quotes the exact evidence. (4) Writes the explanation and actions in up to five languages. |
| **Variants** | `gemma-4-26b-a4b-it` via the Gemini API for the hosted demo (free tier, no GPU needed). `gemma4:e4b` via Ollama for fully local, offline use on a laptop. The same prompts work for both through one provider interface. |
| **Licence** | Apache 2.0. Commercial use, modification and redistribution allowed. We comply by attributing and not implying endorsement. |
| **Why Gemma 4** | Open weights under a permissive licence; reads images (needed for screenshots); claims 140+ languages; the E4B size runs on a student laptop; available hosted for a public demo. |
| **Limitations** | Yorùbá, Hausa and Igbo output quality is lower than English and has **not yet been rated by native speakers**. It can be overconfident and can invent quotes, which the grounding check catches (§6). Hosted calls have rate limits and need internet. |

**Alternatives we considered** (detail in [`docs/planning/01-RESEARCH.md`](docs/planning/01-RESEARCH.md)):
- **N-ATLaS 8B** (NCAIR / Awarri). Trained for Nigerian languages, but its custom licence caps use at
  1,000 monthly active users without a commercial licence, it has no image input, no hosted endpoint, and
  its own card rates Yorùbá its weakest language. Kept as a comparison target.
- **Qwen**. Strong and multilingual, but less evidence for Nigerian languages. Comparison target.

### YarnGPT2: voice notes
| | |
|---|---|
| **Role** | Text-to-speech for voice notes in Yorùbá, Hausa, Igbo and Nigerian-accent English (also used for Pidgin). |
| **Licence** | Apache 2.0 |
| **Why** | Nigerian voices under an open licence. `facebook/mms-tts-yor` is CC-BY-NC (non-commercial). |
| **Limitations** | Needs PyTorch, so it runs as a separate service ([`services/voice`](services/voice)); slow on CPU; the model card notes audio can be rushed. |

## 6. Architecture and technical decisions

```
           web: text / screenshot          button phone: USSD / SMS (Africa's Talking)
                      │                                   │
                      ▼                                   ▼
   ┌──────────────────────────────┐        ┌──────────────────────────────┐
   │ /api/analyze                 │        │ /api/channels/ussd · /sms     │
   │ screenshot? → Gemma 4 OCR    │        │ language menu / prefix        │
   └──────────────┬───────────────┘        └──────────────┬───────────────┘
                  └──────────────────┬────────────────────┘
                                     ▼
           ┌───────────────────────────────────────────────────┐
           │ 1. Rules engine (TypeScript regex, ~15 rules)     │ → flags with exact spans
           │ 2. Gemma 4 → JSON {verdict, red_flags[quote],     │
           │    explanations{en,pcm,yo,ha,ig}}                 │
           │ 3. Grounding: drop any quote not in the message   │
           │ 4. Merge: rules set a floor under the verdict     │
           │ 5. Fill any missing language from templates       │
           └───────────────────────┬───────────────────────────┘
                                   ▼
     Web: verdict, highlights, 5 language tabs, voice note (/api/voice → YarnGPT2 service)
     Phones: GSM-7 reply ≤ 182 chars (USSD) or ≤ 2 SMS segments
```

**Key decisions**
- **Rules + model, not model alone.** Rules are instant, explainable, and can't hallucinate. The model
  handles context that rules miss (fake jobs, investment schemes, pastor/landlord requests). The merge
  ([`lib/sora/analyze.ts`](lib/sora/analyze.ts)) lets the model raise a verdict, but a high-severity rule
  hit (PIN/OTP/BVN request, fee before reward, mistaken-transfer refund) can **never** become
  “no red flags”.
- **Grounding check.** Every model red flag must quote the message. Quotes are matched ignoring case,
  spacing and tone marks, with a fuzzy fallback for OCR noise ([`lib/sora/grounding.ts`](lib/sora/grounding.ts)).
  Quotes that don't match are dropped and counted, and the eval reports the grounding rate.
- **Never “safe”.** The calmest verdict is “No red flags found. Still confirm with your bank directly.”
- **Graceful degradation.** No API key, rate limit or timeout → rules + reviewed templates answer, and
  the UI says “Rules mode”. Screenshots then fall back to on-device OCR (Tesseract.js), which also
  rejoins chat-bubble line wraps so split links are still caught. USSD gets an 8 s model budget because sessions time out at about 20 s.
- **GSM-7 for phones.** Tone marks force UCS-2 encoding (70 chars per SMS instead of 160) and many basic
  phones can't display them, so phone replies are folded to plain letters. The web keeps full orthography.
- **One codebase on Vercel.** Next.js 16 (App Router) serves the UI and the API as serverless functions.
  Only the TTS model, which needs PyTorch, runs elsewhere.
- **Swappable model backend.** `SORA_BACKEND=gemini|openai|rules`. The `openai` backend talks to any
  OpenAI-compatible server (Ollama, vLLM, llama.cpp, LM Studio).
- **Privacy.** Messages are processed in memory, never stored or logged.

**Dependencies:** Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Motion, Phosphor Icons, Zod
(runtime), Tesseract.js (on-device OCR fallback), Vitest, tsx (dev). Voice service: Python 3.11, FastAPI, PyTorch, transformers, YarnGPT.

## 7. Setup, run, test, reproduce

**Requirements:** Node.js 20+ (tested on 24) and npm. Optional: a free
[Google AI Studio key](https://aistudio.google.com/apikey) **or** [Ollama](https://ollama.com).

```bash
git clone https://github.com/daodudestiny56-netizen/Sora.git
cd Sora
npm install
cp .env.example .env        # then pick ONE model option below
npm run dev                 # http://localhost:3000
```

**Model options** (in `.env`):
- **Hosted Gemma 4 (easiest):** set `GEMINI_API_KEY=...`. Uses `gemma-4-26b-a4b-it`.
- **Local Gemma 4 E4B (offline):** `ollama pull gemma4:e4b`, then set `SORA_BACKEND=openai`
  (the defaults point to `http://localhost:11434/v1`).
- **No model:** leave both empty. Ṣọ́ra runs on rules + templates, and screenshots are read on the device with Tesseract.js.

**Tests and checks**
```bash
npm test            # rules, grounding, merge, OCR cleanup, USSD/SMS (24 tests)
npm run typecheck
npm run lint
npm run build
```

**Reproduce the evaluation**
```bash
npm run eval                                   # rules only, no key needed
npm run eval -- --backend gemini               # Gemma 4 26B A4B + rules
npm run eval -- --backend openai               # local Gemma 4 E4B + rules
npm run eval -- --backend gemini --langs en,yo --limit 20   # quicker run that also generates Yorùbá
```
Results go to `eval/results/<run>.json` (per-message rows) and `eval/results/summary.json` (what the
website and the table below show).

**Try the phone channels locally**
```bash
curl -X POST localhost:3000/api/channels/ussd -d "text=3*1*send your BVN and OTP"
curl -X POST localhost:3000/api/channels/sms -H "Content-Type: application/json" \
  -d '{"text":"YO Congratulations! Pay N3,500 registration fee to claim your grant"}'
```

## 8. Evaluation
**Dataset:** [`data/eval.jsonl`](data/eval.jsonl), 150 messages (89 scam / 61 legitimate; en 121, pcm 10,
yo 8, ha 6, ig 5). Synthetic, written from public scam warnings, no personal data. See the
[dataset card](data/README.md).

**Metrics:** *scam recall* (scams flagged as suspicious or likely scam, because missing a scam is the worst
failure); *false-alarm rate* (legitimate messages flagged, because crying wolf teaches people to ignore
warnings); accuracy; precision; *grounding rate* (model quotes found in the message); latency.

| Engine | Scam recall | Strict recall¹ | False alarms | Accuracy | Grounding | p50 latency |
|---|---|---|---|---|---|---|
| Rules only | 83.1% | 49.4% | 1.6% | 89.3% | n/a | <1 ms |
| Gemma 4 26B A4B + rules | _pending: run `npm run eval -- --backend gemini`_ | | | | | |
| Gemma 4 E4B + rules (local) | _pending_ | | | | | |

¹ Flagged as *likely scam* rather than *suspicious*.

**Reading the rules row honestly:** the rules were revised once after looking at their misses on this
set, so their numbers are optimistic. The 15 scams they still miss are the subtle ones (fake jobs,
investment schemes, requests from a "pastor" or "landlord") that need the model's reading of context.
**Yorùbá/Hausa/Igbo quality** will be reported as a native-speaker rating (1–5 on 30 explanations), not
as a benchmark.

## 9. Button phones: USSD and SMS
Many of the people scammers target use phones with buttons, so Ṣọ́ra has two channels built on the
[Africa's Talking](https://africastalking.com) callback format (the common aggregator for MTN, Airtel,
Glo and 9mobile):

- **USSD** (`POST /api/channels/ussd`): language menu → 1. Check a message · 2. Common scams · 3. How to
  check by SMS. A typed message gets a verdict, reason and action in one screen (≤182 chars).
- **SMS** (`POST /api/channels/sms`): forward the suspicious text, optionally starting with `YO`, `HA`,
  `IG` or `PCM`. The reply fits two GSM-7 segments.
- The website has a **live simulator** that calls these same endpoints.

Going live needs an Africa's Talking account, a shared or dedicated USSD code and SMS number (both
paid and provisioned through telcos), and the callback URLs set in their dashboard. See
[`docs/FEATURE_PHONES.md`](docs/FEATURE_PHONES.md).

## 10. Deployment
| Part | Where | Notes |
|---|---|---|
| Web app + API | **Vercel** | `vercel --prod`. Set `GEMINI_API_KEY` (and optional voice and AT vars) in project env. |
| Reasoning model | **Gemini API** (hosted Gemma 4) | Free tier, rate-limited. Or self-host Gemma 4 with vLLM/Ollama and set `SORA_BACKEND=openai`. |
| Voice model | **Hugging Face Docker Space** | [`services/voice`](services/voice). Set `VOICE_SERVICE_URL` and `VOICE_SERVICE_TOKEN`. |
| Phone channels | **Africa's Talking** | Point the USSD and SMS callbacks at the Vercel URLs. |

Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 11. Limitations, safety and privacy
- **It can be wrong.** It's a prototype and a second opinion. The UI says so and never says “safe”.
- **Not affiliated** with any bank, the CBN, EFCC, NCC or any telco.
- **Language quality:** Yorùbá, Hausa and Igbo text (model output and our templates) still needs
  native-speaker review. See [`docs/LANGUAGES.md`](docs/LANGUAGES.md).
- **Small synthetic eval set**, mostly English. It shows the pipeline works on known patterns, not
  real-world accuracy.
- **Voice notes** need the separate YarnGPT2 service, which is slow on free CPU hosting. Without it,
  the web app falls back to the device voice for English and Pidgin only.
- **USSD/SMS** are implemented and tested against the Africa's Talking format, but going live needs a
  paid shortcode.
- **Privacy:** messages are processed in memory only and never stored or logged by Ṣọ́ra. When the
  hosted model is used, the text is sent to Google's Gemini API under Google's terms. For full privacy,
  use local Gemma 4 E4B via Ollama.
- Rate limiting is best-effort per serverless instance.

## 12. Project structure
```
app/                  Next.js pages and API routes (analyze, voice, channels/ussd, channels/sms, health)
components/           UI: Checker, ResultCard, FeaturePhone simulator, landing sections
lib/sora/             The engine
  rules.ts            deterministic red-flag rules with exact spans
  prompt.ts           Gemma 4 prompts + JSON schema
  providers.ts        Gemini API and OpenAI-compatible (Ollama/vLLM) backends
  grounding.ts        quote grounding check
  analyze.ts          pipeline: OCR → rules → model → grounding → merge
  templates.ts        reviewed explanations in 5 languages (fallback + phones)
  channels.ts         USSD menu, SMS replies, GSM-7 folding
data/eval.jsonl       150-message eval set + dataset card
scripts/eval.ts       evaluation script
eval/results/         recorded results
services/voice/       YarnGPT2 voice service (FastAPI, Docker)
tests/                Vitest unit tests
docs/                 deployment, phones, languages, planning (research, PRD)
```

## 13. Contributing
Issues and PRs are welcome, especially **native-speaker review** of Yorùbá, Hausa, Igbo and Pidgin
text, new **anonymised scam examples**, and new rules. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 14. Acknowledgements
- **Gemma 4** by Google DeepMind, Apache 2.0. Served through the Gemini API or Ollama.
- **YarnGPT2** by Saheed Azeez, Apache 2.0. Uses **WavTokenizer** (novateur) weights.
- **N-ATLaS** (NCAIR / Awarri) and **Qwen**: considered and documented as comparison models.
- **Africa's Talking**: USSD and SMS callback format.
- Libraries: Next.js, React, Tailwind CSS, Motion, Phosphor Icons, Zod, Vitest, tsx, FastAPI, PyTorch,
  Hugging Face transformers. **Tesseract.js** (Apache 2.0) for on-device OCR. Fonts: Bricolage Grotesque and Geist Mono (SIL Open Font License).
- Scam patterns are drawn from public CBN and bank fraud advisories and Nigerian tech press. Sources
  are listed in [`docs/planning/01-RESEARCH.md`](docs/planning/01-RESEARCH.md).
- **AI-assisted work (disclosed as the challenge rules require):** we used an AI coding assistant
  (Claude Code, Anthropic) for a large part of the implementation, the first drafts of the
  eval-set messages and the translation templates, and drafts of this documentation, under the team's
  direction. The team reviews, tests and is responsible for everything submitted.

## 15. Next steps
A WhatsApp bot (WhatsApp Business API) · voice input so parents can speak the message (NCAIR Yorùbá
ASR) · native-speaker evaluation · a community-reported scam feed · an offline Android app running
Gemma 4 E2B on the device · a live USSD shortcode with a telco partner.
