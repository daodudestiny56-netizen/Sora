# Ṣọ́ra: check a message before you send money

> *Ṣọ́ra* (Yorùbá): “be careful.” Written with tone marks so it isn't confused with other products named “Sora”.

Ṣọ́ra checks a suspicious SMS, WhatsApp message or screenshot, **points at the exact words that give
the scam away**, and tells the person what to do in **English, Nigerian Pidgin, Yorùbá, Hausa or Igbo**,
with a voice note they can play. It reaches people wherever they are: the **web**, an **installable
app that works offline**, a **WhatsApp bot**, and **USSD and SMS for button phones**. A one-minute
**practice game** teaches the signs before the next scam arrives. It runs on **Gemma 4**, an
open-weight model under Apache 2.0.

Built for **OPEN//BUILD 2026** (OSCA Ile-Ife Hacktoberfest).

| | |
|---|---|
| **Live demo** | https://sora-ecru-kappa.vercel.app |
| **Demo video** | [Watch the 90-second demo](https://drive.google.com/file/d/1xJRNPBgbtd-CdYqbIpat3GN_I3RutuzR/view?usp=sharing) |
| **Run locally** | [Setup](#7-setup-run-test-reproduce): `npm install && npm run dev` |
| **Headline result** | Gemma 4 + rules catch **98.9%** of scams with **1.6%** false alarms on our 150-message eval ([§8](#8-evaluation)) |
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
9. [Reaching people where they are](#9-reaching-people-where-they-are)
10. [Deployment](#10-deployment)
11. [Limitations, safety and privacy](#11-limitations-safety-and-privacy)
12. [Project structure](#12-project-structure)
13. [Contributing](#13-contributing)
14. [Acknowledgements](#14-acknowledgements)
15. [Next steps](#15-next-steps)

---

## 1. Team
| Name | University |
|---|---|
| Daodu Destiny | Obafemi Awolowo University (OAU), Ile-Ife |
| Oyewole Caleb | Obafemi Awolowo University (OAU), Ile-Ife |

## 2. Problem statement
Nigerian families get a steady stream of scam messages: "your BVN is blocked, click to verify",
lookalike bank sender IDs, fake credit alerts followed by "I sent it by mistake, please refund", "this is
my new number" requests, and fake government grants that need a "registration fee". The people most
at risk, often older parents, may read English slowly, trust official-looking messages, and have nobody
to ask in the moment. Many use button phones or have little mobile data. Their children end up as the
family's fraud desk, usually after the money is gone.

Existing tools (carrier spam filters) label a message at best. They don't say **why**, don't cover WhatsApp
or screenshots, don't speak Yorùbá, Hausa, Igbo or Pidgin, and don't help people without smartphones.

## 3. Intended users
- **The "family tech support" student** (18–25, smartphone, WhatsApp-native). Pastes or shares the
  message or screenshot a parent forwarded and sends back a clear answer or a voice note.
- **The parent or grandparent.** Yorùbá-, Hausa-, Igbo- or Pidgin-first, prefers voice notes. Forwards the
  message to the Ṣọ́ra WhatsApp number, or, on a button phone, dials the USSD code or forwards the SMS,
  and gets a reply in their own language.
- **Scenario:** Mum forwards a screenshot asking “Is this true?” → the student shares it into Ṣọ́ra →
  within seconds they have a verdict, the highlighted red flags, and a Yorùbá voice note to send back.
  Later they play “Scam or real?” together so Mum spots the next one herself.

## 4. Solution

### Features
| Feature | What it does |
|---|---|
| **Verdict** | *Likely scam*, *Suspicious*, or *No red flags found*. Never “safe”. |
| **Evidence highlights** | Each red flag quotes the exact phrase from the message, highlighted in place, with a one-line reason. |
| **What to do** | 1–3 concrete steps, e.g. “Check your balance in your bank app, not the SMS.” |
| **Five languages** | English, Pidgin, Yorùbá, Hausa and Igbo, with full tone marks on the web and WhatsApp. |
| **Screenshots** | Gemma 4 reads text from screenshots (sender ID, links, amounts). Without a model, or if it fails, Tesseract.js reads them **on the device**, so the image never leaves the phone. |
| **Voice notes** | YarnGPT2 Nigerian-accent TTS. Play, download or share. |
| **WhatsApp bot** | Forward a suspicious message or screenshot to the Ṣọ́ra WhatsApp number and get the verdict, steps and red flags back in your language, plus a voice note. Built on Twilio ([guide](docs/WHATSAPP.md)). |
| **Installable app (PWA)** | Add to home screen. On Android, **share a suspicious SMS straight into Ṣọ́ra** from the share sheet. **Works offline**: the rules and reviewed explanations run on the phone. |
| **Button phones** | USSD menu and SMS forwarding on the same engine, replies sized for 2G screens. A live simulator on the website. |
| **Practice game** | “Scam or real?”: eight messages in five languages. Each answer highlights the giveaway words using the same rules as the checker, and ends with a WhatsApp challenge to send to family. |
| **Share to family** | One tap sends the explanation to WhatsApp. |
| **Works without the model** | If the model is unreachable, deterministic rules and hand-written translations still answer. |

### Feature status
| Feature | Status on the live demo |
|---|---|
| Checker (text + screenshots), five languages, highlights | ✅ Live with Gemma 4 |
| Installable app, offline check, Android share target | ✅ Live |
| Practice game | ✅ Live |
| USSD and SMS | ✅ Endpoints and website simulator live. Real phone numbers need a paid Africa's Talking shortcode. |
| WhatsApp bot | ✅ Built and tested locally. Needs Twilio sandbox keys to receive real WhatsApp messages. |
| Voice notes (YarnGPT2) | ⏳ Service built ([`services/voice`](services/voice)) and run locally in Docker: it returns audio in all four voices. Not yet hosted, so the live site does not use it. English and Pidgin use the device voice meanwhile. |

## 5. Model information

### Gemma 4: the reasoning and reading model
| | |
|---|---|
| **Role** | (1) Reads screenshots (OCR). (2) Judges whether a message is a scam using context. (3) Quotes the exact evidence. (4) Writes the explanation and actions in up to five languages. |
| **Variants** | `gemma-4-26b-a4b-it` via the Gemini API for the hosted demo (free tier, no GPU needed). `gemma4:e4b` via Ollama for fully local, offline use on a laptop. The same prompts work for both through one provider interface. |
| **Licence** | Apache 2.0. Commercial use, modification and redistribution allowed. We comply by attributing and not implying endorsement. |
| **Why Gemma 4** | Open weights under a permissive licence; reads images (needed for screenshots); claims 140+ languages; the E4B size runs on a student laptop; available hosted for a public demo. |
| **Limitations** | Yorùbá, Hausa and Igbo output quality is lower than English and has **not yet been rated by native speakers**. In testing we saw a wrong Yorùbá word choice and a garbled Igbo sentence. It can be overconfident and could invent quotes, which the grounding check catches (§6). Hosted calls have rate limits, need internet, and occasionally fail with HTTP 500 (§8). |

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

### Tesseract.js: on-device OCR fallback
Not a generative model. It reads English text from screenshots in the browser when Gemma 4 isn't
available or the phone is offline. It is weaker on tone-marked Yorùbá text.

## 6. Architecture and technical decisions

```
 web / installed app        WhatsApp (Twilio)           button phone (Africa's Talking)
 text · screenshot ·        text · screenshot           USSD menu · SMS forward
 Android share sheet               │                              │
        │                          ▼                              ▼
        │              /api/channels/whatsapp       /api/channels/ussd · /sms
        │              (signature check, ack now,   (language menu or YO/HA/IG/PCM
        │               reply in background)         prefix, GSM-7 replies)
        ▼                          │                              │
   /api/analyze ◄──────────────────┴──────────────────────────────┘
        │   screenshot? → Gemma 4 reads it (or Tesseract.js on the device)
        ▼
 ┌────────────────────────────────────────────────────┐
 │ 1. Rules engine (TypeScript regex)                 │ → flags with exact spans
 │ 2. Gemma 4 → JSON {verdict, red_flags[quote],      │
 │    explanations{en,pcm,yo,ha,ig}}                  │
 │ 3. Grounding: drop any quote not in the message    │
 │ 4. Merge: rules set a floor under the verdict      │
 │ 5. Fill any missing language from templates        │
 └──────────────────────────┬─────────────────────────┘
                            ▼
  verdict · highlights · 5 languages · voice note (/api/voice → YarnGPT2 service)

 Offline (service worker): rules + templates run in the browser (lib/sora/local.ts)
```

**Key decisions**
- **Rules + model, not model alone.** Rules are instant, explainable, and can't hallucinate. The model
  handles context that rules miss (fake jobs, investment schemes, pastor/landlord requests). The merge
  ([`lib/sora/analyze.ts`](lib/sora/analyze.ts)) lets the model raise a verdict, but the model can
  **never turn a rules warning green**: any rules warning stays at least *suspicious*, and a strong rules
  case (a PIN/OTP/BVN request, fee before reward, mistaken-transfer refund, or rules score 5+) stays
  *likely scam*. When the model disagrees with the rules, the reviewed templates write the explanation,
  so text injected into a scam message cannot shape what the user reads.
- **Grounding check.** Every model red flag must quote the message. Quotes are matched ignoring case,
  spacing and tone marks, with a fuzzy fallback for OCR noise ([`lib/sora/grounding.ts`](lib/sora/grounding.ts)).
  Quotes that don't match are dropped and counted, and the eval reports the grounding rate.
- **Never “safe”.** The calmest verdict is “No red flags found. Still confirm with your bank directly.”
- **No false reassurance when the check was partial.** If Gemma timed out or failed, or the phone was
  offline, and the rules found nothing, Ṣọ́ra says **“Couldn't fully check — don't pay or reply yet”**
  (web, WhatsApp, SMS and USSD, in all five languages) instead of “No red flags found”.
- **Graceful degradation.** No API key, rate limit or timeout → rules + reviewed templates answer, and
  the UI says “Rules mode”. Transient Gemini API errors are retried twice first. Screenshots fall back
  to on-device OCR, which also rejoins chat-bubble line wraps so split links are still caught. USSD gets
  an 8 s model budget because sessions time out at about 20 s.
- **One engine, many channels.** Web, WhatsApp, SMS and USSD all call the same `analyze()` pipeline,
  so a fix or new rule improves every channel at once.
- **WhatsApp replies in the background.** Twilio waits only 15 s, and reading a screenshot can take
  longer, so the webhook acknowledges at once and replies through Twilio's API after the response
  (Next.js `after()`). Requests without a valid `X-Twilio-Signature` are rejected, and media is only
  ever downloaded from Twilio's own host, so the webhook can't be used to fetch other URLs.
- **Webhooks can't cost us money.** SMS replies are only sent for genuine Africa's Talking callbacks
  (a secret in the callback URL), never for the website simulator or anonymous requests. Provider errors
  are logged on the server and the browser only sees a short code (`timeout`, `rate_limited`…).
  Every model call, including retries, shares one time budget. Pages can't be framed (clickjacking).
- **GSM-7 for button phones.** Tone marks force UCS-2 encoding (70 chars per SMS instead of 160) and many
  basic phones can't display them, so SMS/USSD replies are folded to plain letters. Web and WhatsApp
  keep full orthography.
- **Progressive Web App instead of an app store.** A web manifest with a `share_target` and a
  hand-written service worker ([`public/sw.js`](public/sw.js)). The app shell, icons and OCR engine are
  cached so the app opens and checks messages with no data. `/api/*` is never cached, so checked
  messages are not stored on the device.
- **The game teaches what the checker checks.** The practice game highlights answers with the same rules
  engine, and a test makes sure the game never calls a message “real” that the checker would flag.
- **One codebase on Vercel.** Next.js 16 (App Router) serves the UI and the API as serverless functions.
  Only the TTS model, which needs PyTorch, runs elsewhere.
- **Swappable model backend.** `SORA_BACKEND=gemini|openai|rules`. The `openai` backend talks to any
  OpenAI-compatible server (Ollama, vLLM, llama.cpp, LM Studio).
- **Privacy.** Messages are processed in memory, never stored or logged.

**Dependencies:** Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Motion, Phosphor Icons, Zod,
Tesseract.js (runtime); Vitest, tsx, ESLint (dev). Voice service: Python 3.11, FastAPI, PyTorch,
transformers, YarnGPT.

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
- **Local Gemma 4 E4B (offline):** `ollama pull gemma4:e4b`, then set `SORA_BACKEND=openai` and
  uncomment the `OPENAI_*` lines.
- **No model:** leave both empty. Ṣọ́ra runs on rules + templates, and screenshots are read on the
  device with Tesseract.js.

Optional extras (all in `.env.example`): `VOICE_SERVICE_URL`/`VOICE_SERVICE_TOKEN` for voice notes,
`TWILIO_*` for WhatsApp, `AT_*` for SMS/USSD.

**Tests and checks**
```bash
npm test            # 65 tests: rules, grounding, merge, prompt, providers, OCR, offline, game, channels, hardening
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

**Try the other channels locally**
```bash
# USSD: Yorùbá → check a message
curl -X POST localhost:3000/api/channels/ussd -d "text=3*1*send your BVN and OTP"
# SMS forward with a language prefix
curl -X POST localhost:3000/api/channels/sms -H "Content-Type: application/json" \
  -d '{"text":"YO Congratulations! Pay N3,500 registration fee to claim your grant"}'
# WhatsApp (without Twilio keys the reply comes back directly as TwiML)
curl -X POST localhost:3000/api/channels/whatsapp --data-urlencode "From=whatsapp:+2348000000001" \
  --data-urlencode "Body=HA I need N2,000 for fuel before I can deliver your order" --data-urlencode "NumMedia=0"
```

## 8. Evaluation
**Dataset:** [`data/eval.jsonl`](data/eval.jsonl), 150 messages (89 scam / 61 legitimate; en 121, pcm 10,
yo 8, ha 6, ig 5). Synthetic, written from public scam warnings, no personal data. See the
[dataset card](data/README.md).

**Metrics:** *scam recall* (scams flagged as suspicious or likely scam, because missing a scam is the worst
failure); *false-alarm rate* (legitimate messages flagged, because crying wolf teaches people to ignore
warnings); accuracy; precision; *grounding rate* (model quotes found in the message); latency.

| Engine | Scam recall | Strict recall¹ | False alarms | Accuracy | Grounding² | p50 / p95 latency |
|---|---|---|---|---|---|---|
| Rules only, revision 1 | 83.1% | 49.4% | 1.6% | 89.3% | n/a | <1 ms |
| Rules only, revision 2 (current; also the offline mode) | 98.9% | 56.2% | 1.6% | 98.7% | n/a | <1 ms |
| **Gemma 4 26B A4B + rules** ³ | **98.9%** | **95.5%** | **1.6%** | **98.7%** | **100%** | 6.6 s / 8.7 s |
| Gemma 4 E4B + rules (local) | _pending: needs a machine with Ollama_ | | | | | |
| Rules only, revision 2, on 50 fresh messages ⁴ | 43.3% | 26.7% | 5.0% | 64.0% | n/a | <1 ms |
| Gemma 4 26B A4B + rules, on the same 50 fresh messages ⁴ | _pending: needs the Gemini key_ | | | | | |

¹ Flagged as *likely scam* rather than *suspicious*. ² Share of the model's quoted evidence found word
for word in the message (0 invented quotes on this set). ³ Measured with rules revision 1 and before the
prompt hardening; being re-run with the current code. ⁴ [`data/holdout.jsonl`](data/holdout.jsonl): 30
scams and 20 legitimate messages in English and Pidgin, written after the rules were frozen. No rule was
tuned on them. They are still synthetic and AI-assisted, and small, so treat them as a rough check, not a
benchmark.

Run on 2026-10-25 with `npm run eval -- --backend gemini` (English explanations only, to keep the run
short). Per language, Gemma 4 + rules caught every scam in Pidgin (7/7), Yorùbá (5/5), Hausa (4/4) and
Igbo (3/3), but these subsets are tiny.

**What went wrong, and why:**
- **1 missed scam** (`e058`, a fake "Shell is recruiting drivers" job asking for a form fee). Google's
  API returned an internal error (HTTP 500) for this message even after retries, so it was judged by the
  rules alone, which miss it. 6 of 150 calls failed this way and fell back to rules. We report them as
  they happened rather than re-running only the failures. When we re-ran `e058` by itself, Gemma flagged
  it as a likely scam.
- **1 false alarm** (`e147`, a real bank reminder to "update your BVN details at any of our branches").
  Gemma judged it fine, but the rules flag any BVN-update request and the safety floor keeps it at
  *suspicious*. We accept this trade-off on purpose: a real bank can always be checked by calling it,
  while a missed BVN phish can empty an account.

**Reading the rules rows honestly:** the rules were revised twice after looking at their misses on this
set, so both rows are optimistic, and revision 2 is no longer a fair baseline. It was written to catch
exactly the 15 scams revision 1 missed (fake jobs and delivery or meter fees, "lost my phone" and
relative-in-danger requests, a "pastor" asking for money, investment pitches, a "fine" to avoid arrest).
One scam still gets through: a romance request for a gift card (`e070`).

Short regex rules are brittle when a scammer rewords, and the held-out row shows it. On 50 messages
written after the rules were frozen, the rules alone caught 43.3% of the scams (13 of 30) and raised 1
false alarm in 20 (a real "your card has been blocked at your request" notice). So 98.9% describes how
well the rules fit the eval set, not how well they work on new scams. The offline mode uses only the
rules, so it has the same limit. Gemma 4 is the part that handles wording we did not anticipate. It also
quotes the evidence, reads screenshots and writes the explanation in five languages. Its result on the
held-out set is pending. The held-out messages are synthetic and AI-assisted like the rest of the data;
real, anonymised messages from our parent testing will be added (see [`data/README.md`](data/README.md)).

**Yorùbá/Hausa/Igbo quality** will be reported as a native-speaker rating (1–5 on 30 explanations), not
as a benchmark.

## 9. Reaching people where they are
| Channel | How it works | Guide |
|---|---|---|
| **Web / installed app** | Paste, upload, or (Android) share a message into Ṣọ́ra. Works offline with the rules engine. | §6 |
| **WhatsApp** | Forward a message or screenshot to the Ṣọ́ra number. Start with `YO`, `HA`, `IG` or `PCM` for another language. Replies keep tone marks and can include a voice note. | [`docs/WHATSAPP.md`](docs/WHATSAPP.md) |
| **USSD** | Dial the code, pick a language → 1. Check a message · 2. Common scams · 3. How to check by SMS. One-screen verdict (≤182 chars). | [`docs/FEATURE_PHONES.md`](docs/FEATURE_PHONES.md) |
| **SMS** | Forward the suspicious text, optionally with a language prefix. Reply fits two GSM-7 segments. | [`docs/FEATURE_PHONES.md`](docs/FEATURE_PHONES.md) |

USSD and SMS use the [Africa's Talking](https://africastalking.com) callback format (the common aggregator
for MTN, Airtel, Glo and 9mobile). The website has a **live button-phone simulator** that calls the same
endpoints. Going live needs a paid shortcode provisioned through telcos.

## 10. Deployment
| Part | Where | Notes |
|---|---|---|
| Web app + API | **Vercel** | `vercel --prod`. Set `GEMINI_API_KEY` and any optional keys in project env. |
| Reasoning model | **Gemini API** (hosted Gemma 4) | Free tier, rate-limited. Or self-host Gemma 4 with vLLM/Ollama and set `SORA_BACKEND=openai`. |
| Voice model | **Hugging Face Docker Space** | [`services/voice`](services/voice). Set `VOICE_SERVICE_URL` and `VOICE_SERVICE_TOKEN`. |
| WhatsApp bot | **Twilio** (free sandbox) | Point the sandbox webhook at `/api/channels/whatsapp`. |
| USSD / SMS | **Africa's Talking** | Point the USSD and SMS callbacks at the Vercel URLs. |

Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 11. Limitations, safety and privacy
- **It can be wrong.** It's a prototype and a second opinion. The UI says so and never says “safe”.
- **Not affiliated** with any bank, the CBN, EFCC, NCC or any telco.
- **Language quality:** Yorùbá, Hausa and Igbo text (model output and our templates) still needs
  native-speaker review. See [`docs/LANGUAGES.md`](docs/LANGUAGES.md).
- **Small synthetic eval set**, mostly English. It shows the pipeline works on known patterns, not
  real-world accuracy.
- **Offline mode is weaker.** It uses the rules only. They caught 43% of the scams in our held-out check
  of 50 fresh messages (99% on the eval set they were tuned on), so a reworded scam can slip past them.
  Use the online mode for anything important. On-device OCR reads English well but may drop Yorùbá tone marks.
- **Voice notes** need the separate YarnGPT2 service, which is slow on free CPU hosting and not yet
  deployed. Without it, the web app uses the device voice for English and Pidgin only.
- **WhatsApp** runs on Twilio's sandbox: each tester must first send the sandbox `join` code. A public
  number needs a Meta-approved WhatsApp Business sender.
- **USSD/SMS** are implemented and tested against the Africa's Talking format, but going live needs a
  paid shortcode.
- **Share target** is Android only (iOS doesn't support it for web apps). Install and offline work on both.
- **Privacy:** messages are processed in memory only and never stored or logged by Ṣọ́ra. When the
  hosted model is used, the text is sent to Google's Gemini API under Google's terms, and WhatsApp
  messages pass through Twilio. For full privacy, use local Gemma 4 E4B via Ollama or the offline mode.
- Rate limiting is best-effort per serverless instance. A determined attacker could still use up the
  free Gemini quota; the app then answers with the rules and says it couldn't fully check.
- **Yorùbá wording:** Gemma 4 first called a scam “ìtàgé” (flirting). The prompt now gives it the right
  words (“jìbìtì”, “ìtànjẹ”) and it uses them, but its Yorùbá sentences can still be awkward.

## 12. Project structure
```
app/                  Next.js pages, API routes, web manifest, icons
  api/analyze         the checker
  api/channels/       ussd · sms · whatsapp webhooks
  api/voice           YarnGPT2 proxy (POST for the web, signed GET for WhatsApp)
  api/health          which engine is live
components/           UI: Checker, ResultCard, Quiz, FeaturePhone simulator, Nav, Pwa, landing sections
lib/sora/             the engine
  rules.ts            deterministic red-flag rules with exact spans
  prompt.ts           Gemma 4 prompts + JSON schema
  providers.ts        Gemini API and OpenAI-compatible (Ollama/vLLM) backends, with retries
  grounding.ts        quote grounding check
  analyze.ts          pipeline: OCR → rules → model → grounding → merge
  templates.ts        reviewed explanations in 5 languages (fallback + phones)
  channels.ts         USSD menu, SMS replies, GSM-7 folding
  whatsapp.ts         Twilio: signature check, reply format, media, signed voice links
  local.ts            offline, in-browser check (rules + templates)
lib/ocr.ts            on-device OCR (Tesseract.js) and line unwrapping
lib/quiz.ts           "Scam or real?" game data in five languages
public/sw.js          service worker (offline shell, OCR cache; never caches messages)
public/icons/         app icons
data/eval.jsonl       150-message eval set + dataset card
scripts/eval.ts       evaluation script
eval/results/         recorded results
services/voice/       YarnGPT2 voice service (FastAPI, Docker)
tests/                Vitest unit tests
docs/                 deployment, WhatsApp, phones, languages, planning (research, PRD)
```

## 13. Contributing
Issues and PRs are welcome, especially **native-speaker review** of Yorùbá, Hausa, Igbo and Pidgin
text, new **anonymised scam examples**, new **practice-game messages**, and new rules. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## 14. Acknowledgements
- **Gemma 4** by Google DeepMind, Apache 2.0. Served through the Gemini API or Ollama.
- **YarnGPT2** by Saheed Azeez, Apache 2.0. Uses **WavTokenizer** (novateur) weights.
- **Tesseract.js**, Apache 2.0, for on-device OCR.
- **N-ATLaS** (NCAIR / Awarri) and **Qwen**: considered and documented as comparison models.
- **Twilio** WhatsApp API (sandbox) for the WhatsApp bot. **Africa's Talking** USSD and SMS callback format.
- Libraries: Next.js, React, Tailwind CSS, Motion, Phosphor Icons, Zod, Vitest, tsx, FastAPI, PyTorch,
  Hugging Face transformers. Fonts: Bricolage Grotesque and Geist Mono (SIL Open Font License).
- Scam patterns are drawn from public CBN and bank fraud advisories and Nigerian tech press. Sources
  are listed in [`docs/planning/01-RESEARCH.md`](docs/planning/01-RESEARCH.md).
- **AI-assisted work (disclosed as the challenge rules require):** we used an AI coding assistant
  (Claude Code, Anthropic) for a large part of the implementation, the first drafts of the
  eval-set messages, the translation templates and the game messages, and drafts of this documentation,
  under the team's direction. The team reviews, tests and is responsible for everything submitted.
- **Demo video:** the narration is AI text-to-speech (Microsoft's Nigerian-English `en-NG-EzinneNeural`
  voice) and the music was generated in code for this video. All app scenes are real screen captures of
  the live site; the opening phone scenes are illustrations of a typical scam.

## 15. Next steps
Native-speaker evaluation of all five languages · a Gemma 4 E4B vs 26B vs 31B comparison on the same
eval · an approved WhatsApp Business number · a live USSD shortcode with a telco partner · voice input so
parents can speak the message (NCAIR Yorùbá ASR) · Gemma 4 E2B running inside the app on the phone for
full offline AI · a community-reported scam feed.
