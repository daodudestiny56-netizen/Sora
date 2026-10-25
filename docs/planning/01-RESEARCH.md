# 01 — Research dossier

Research date: 2026-10-25. Evidence labels:
**[V]** verified from a primary source · **[S]** secondary source (press/blog) · **[I]** our inference · **[?]** unknown / still to check.

---

## 1. Event facts (from the official challenge brief PDF) [V]

- Organiser: Open Source Community Africa (OSCA), Ile-Ife — Hacktoberfest 2026 programme.
- Teams: exactly 2 currently enrolled university students; cross-university allowed; one team per person.
- Build window Oct 25–29; deadline Thu Oct 29, 11:59 PM WAT; repo and demo links must work.
- Top 7 notified Sat Oct 31 by 9 AM; virtual Demo Day 4 PM: 3 min slides + 5 min live demo (8 min slot).
- Prizes: 1st ₦50k, 2nd ₦30k, 3rd ₦20k. Special awards (teams outside the top 3 only): Best Open-Source Practice ₦20k, Most Creative ₦15k, Community Impact ₦15k.

### Hard requirements (all five must be met)
- **A. Defined problem:** specific problem, specific users, why it matters.
- **B. Open-weight model, meaningfully used:** name it, say what it does and why it fits. *Must check and comply with the licence; "open weights ≠ open source".*
- **C. Working prototype:** web app / mobile / CLI / API / research prototype. Polish does not replace function.
- **D. GitHub repo** accessible to judges, README with how to run / test / reproduce.
- **E. Technical decisions documented:** model, fit, dependencies, limitations, key implementation choices.

### Submission form fields
Project name · team names + universities · problem statement · solution description · GitHub link · working demo (live link, video, or run instructions) · model information · documentation · acknowledgements (licences, datasets, reused code, **AI-assisted work**).

### Conduct rules that matter for us
- No secrets, credentials or **sensitive personal data** in repo or demo → any real scam messages we collect must be anonymised.
- No fabricated results or overclaiming → eval numbers must be real; limitations stated plainly.
- Healthcare projects must state limits (not our category, but the same honesty standard applies).

## 2. Judging analysis

| Criterion | Pts | What judges will look for [I] |
|---|---|---|
| Problem understanding & usefulness | 25 | A real person with a real problem; we clearly know the users |
| Working prototype & execution | 25 | The core loop works live, without hand-waving |
| Meaningful use of open-weight model | 20 | The model does real work; the choice is *justified with evidence* |
| Creativity & thoughtful design | 15 | Not another chatbot; UX suits the actual user |
| Open-source practices & docs | 15 | README, licence, acknowledgements, reproducibility |

- Judges may be product managers, AI engineers, open-source advocates, founders [V]. → We need a story for PMs and founders (users, pain), rigour for AI engineers (eval), and repo hygiene for open-source advocates.
- "A large project does not automatically score higher" [V] → keep the scope small and make it work.
- **Predicted competition [I]:** most student teams will build a study assistant / PDF-chat / past-question tutor. Standing out on originality and problem clarity is the cheapest way to gain points.

## 3. Open-weight model landscape (Nigerian-language relevant)

| Model | What it is | Licence | Notes |
|---|---|---|---|
| **Gemma 4 E4B** (Google, Apr 2026) | ~4B effective params, text + image + audio input | **Apache 2.0** [S] | Built for edge devices; runs on Ollama; 140+ languages claimed [S]; supports OCR / screen understanding (listed on HF mirrors of the card [S], confirm on official card [?]) |
| Gemma 4 26B A4B / 31B | Larger Gemma 4 | Apache 2.0 [S] | Better quality, needs a GPU; no audio |
| **N-ATLaS** (NCAIR + Awarri, Sep 2025) | Llama-3 8B fine-tune for English, Hausa, Igbo, Yorùbá; 400M+ tokens instruction data | Custom "Open-Source Research and Innovation License" [V] | **≤1,000 monthly active users** without a commercial licence; share-alike; renamed derivatives must say "Powered by Awarri"; gated download; **no hosted inference provider**; own card rates **Yorùbá weakest (2.69/5)**; ~8k practical context [V] |
| **YarnGPT2** (Saheed Azeez, UNILAG grad) | Nigerian-accent TTS on SmolLM2-360M; Yorùbá/Igbo/Hausa voices | **Apache 2.0** [V] | Yorùbá voices: yoruba_male2, yoruba_female2, yoruba_feamle1 [V]; card warns audio can be too fast, may miss accent diversity [V]; no latency figures [?] |
| NCAIR1/Yoruba-ASR | Whisper Small fine-tune (244M) | "other" [S] | Only needed if we add voice input |
| facebook/mms-tts-yor | Meta MMS Yorùbá TTS | CC-BY-NC [?] | Fallback TTS; non-commercial |
| Qwen (current release) | General multilingual LLM | Apache 2.0 for most sizes [?] | Third model in our comparison |

Benchmarks: no 2026 head-to-head of Gemma / Qwen / Llama on Yorùbá or Pidgin was found. AfroBench (ACL 2025) and Lugha-Llama show open models are weak but improvable on Yorùbá [S]. **→ That gap is our opening: we run a small, task-specific comparison ourselves.**

## 4. Problem evidence — scams targeting Nigerian families

- CBN warned on **21 Apr 2026** about emails, messages and links pretending to come from the central bank to harvest personal and financial data [S].
- Common patterns in 2026 [S]: "BVN needs urgent verification" texts with phishing links; lookalike sender IDs ("1stBank", "FirstBank-Alertz"); **fake credit alerts** made with apps that generate convincing transaction notifications (Legit.ng, Aug 2026); the WhatsApp "this is my new number" family-emergency scam; fake government-benefit offers (e.g. a fake "₦85,000 empowerment" in 2025).
- Consistent official guidance [S]: banks and agencies never ask for PIN, OTP, password or BVN by text or chat. → This is easy to encode as hard rules.
- **No reliable national 2026 loss/victim statistics found** [?]. Check EFCC / NPF cybercrime reports / NCC before quoting any number on a slide. Until then, use the CBN warning plus our own families' stories.

### Existing solutions (competition)
- **Airtel Africa AI spam alerts** — labels spam SMS on Airtel lines; language support unknown [S]. Doesn't explain *why*, doesn't cover WhatsApp or screenshots.
- **Nigerian Pidgin phishing detector** (IndabaX Nigeria 2026 paper, 870 emails, 93.9% accuracy) — research model for emails, not a product [V].
- 419-scam classifiers (2015 research) [S].
- **No Yorùbá-language or voice-first scam explainer found** [I, based on searches].

### Why this fits "a world you understand" [I]
Students are the family's tech support. The person most at risk is a parent or grandparent who reads English slowly, trusts official-looking messages, and is used to WhatsApp voice notes. Ṣọ́ra gives the student a tool to forward *and* gives the parent an answer in their language.

## 5. Context: student life at OAU / Nigerian campuses (for other ideas considered)
- Power outages are the most reported campus problem (FUOYE survey: 75.9% rely on rechargeable lamps/power banks) [S]. → Argues for lightweight, low-data design.
- Data cost and poor internet are long-standing barriers to e-learning [S].

## 6. Open questions to resolve
- [?] Confirm Gemma 4 E4B OCR quality on Nigerian bank-alert screenshots (Day 2 test).
- [?] YarnGPT2 Yorùbá: does it need full tone marks in input? CPU latency?
- [?] Which hosted provider serves Gemma 4 for the public demo link (OpenRouter / others), and is it free?
- [?] Can we run N-ATLaS at all (8B on Colab/Kaggle T4 in 4-bit) for the comparison?
- [?] Any OSCA follow-up announcements in the WhatsApp community about extra award conditions.

## Sources
- Challenge brief: OPEN--BUILD-2026-Challenge-Brief.pdf (from organisers)
- N-ATLaS model card — https://huggingface.co/NCAIR1/N-ATLaS
- TechCabal on N-ATLaS launch — https://techcabal.com/2025/09/25/nigerian-government-awarri-launch-n-atlas/
- TechCabal analysis — https://techcabal.com/2025/09/26/the-high-stakes-push-to-build-nigerias-first-open-source-llm/
- Gemma 4 (The Register) — https://www.theregister.com/2026/04/02/googles_gemma_4_open_weights/
- Gemma 4 Apache 2.0 (DataNorth) — https://datanorth.ai/news/google-releases-gemma-4-open-models
- Gemma 4 E4B card — https://huggingface.co/google/Gemma-4-E4B
- Gemma 4 E4B on Jetson — https://www.jetson-ai-lab.com/models/gemma4-e4b
- YarnGPT2 — https://huggingface.co/saheedniyi/YarnGPT2
- YarnGPT story — https://techpoint.africa/2025/02/04/how-unilag-student-created-yarngpt-ai/
- NCAIR Yorùbá ASR — https://huggingface.co/NCAIR1/Yoruba-ASR
- MMS Yorùbá TTS — https://huggingface.co/facebook/mms-tts-yor
- AfroBench — https://aclanthology.org/2025.findings-acl.976.pdf
- Lugha-Llama — https://arxiv.org/pdf/2504.06536
- NaijaNLP survey — https://arxiv.org/pdf/2502.19784
- Pidgin phishing detection — https://proceedings.mlr.press/v319/alhassan26a.html
- 419 scam classifiers — https://arxiv.org/pdf/1508.04123
- Scams in Nigeria 2026 — https://www.techcityng.com/online-scams-nigeria-2026/
- 8 common scam messages — https://www.techcrier.com/2026/07/8-common-scam-messages-nigerians.html
- Fake bank alert SMS — https://www.techcrier.com/2026/08/how-to-spot-fake-bank-alert-sms-before.html
- Fake credit alerts — https://naijatipsland.com/fake-credit-alert-nigeria/
- BVN scams — https://bvncheck.ng/common-bvn-scams-in-nigeria/
- Fake empowerment scam — https://allafrica.com/stories/202504230055.html
- Airtel spam alerts (via TechPoint AI coverage) — https://techpoint.africa/subject/ai
- FUOYE power survey — https://campusreporter.africa/fuoye-students-blame-decades-long-electricity-crisis-for-poor-academic-performance/
- AGROSYNC Yorùbá — https://africa.com/agriculture/nigerian-farmers-can-now-talk-to-their-crop-advisor-in-yoruba
- GSMA Crop2Cash — https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2025/06/GSMA_Cultivating-Climate-Resilience-for-Farmers-through-Digital-Technology-Crop2Cash_2025.pdf
- Gemma 3n Impact Challenge winners — https://blog.google/innovation-and-ai/technology/developers-tools/developers-changing-lives-with-gemma-3n/
