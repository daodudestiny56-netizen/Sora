# 02 — Concepts considered

Scored 1–5 against the rubric, weighted by its points
(Problem ×25, Prototype feasibility ×25, Model use ×20, Creativity ×15, Open-source potential ×15), so the maximum is 500.
"Crowding" is our guess at how many other teams will build something similar. Scores are judgement calls, not measurements.

| # | Concept | Prob | Feas | Model | Creat | OSS | **Score** | Crowding |
|---|---|---|---|---|---|---|---|---|
| 1 | **Ṣọ́ra — scam checker with Yorùbá/Pidgin explanation + voice note** | 5 | 4 | 5 | 5 | 5 | **470** | Low |
| 2 | Official notices (CBN, NAFDAC, OAU circulars) → Yorùbá voice notes | 4 | 4 | 4 | 4 | 4 | 400 | Low |
| 3 | Drug-pack explainer in Yorùbá (photo → dose, warnings) | 5 | 3 | 4 | 4 | 4 | 400 | Low–med |
| 4 | Tenancy / hostel agreement explainer for students | 4 | 4 | 3 | 4 | 3 | 360 | Low |
| 5 | Lecture audio (Nigerian accent) → notes + quiz | 4 | 3 | 4 | 2 | 3 | 335 | High |
| 6 | OAU handbook / course-registration RAG chatbot | 3 | 4 | 3 | 2 | 3 | 310 | High |
| 7 | Past-question tutor / study assistant | 3 | 4 | 3 | 1 | 3 | 295 | Very high |
| 8 | Farmer advisory bot in Yorùbá | 3 | 3 | 4 | 2 | 3 | 300 | Exists (AGROSYNC, Crop2Cash) |
| 9 | Yorùbá tone-mark (diacritic) restorer | 2 | 3 | 4 | 3 | 5 | 315 | Very low |
| 10 | Exam-stress / mental-health companion | 3 | 4 | 2 | 2 | 2 | 265 | Med; safety risk |

## Why Ṣọ́ra wins
- **Problem:** almost every judge and student has a relative who got a "BVN blocked" text or a fake credit alert. It's emotional, specific and easy to demo.
- **Model use is real and can be measured:** reading screenshots, reasoning about context, quoting the evidence, writing in three languages. Plus a published model comparison (Gemma 4 vs N-ATLaS vs Qwen) that answers the "thoughtfulness of model choices" criterion directly.
- **Creativity:** voice-first, made for parents, works with the WhatsApp habits people already have. We found no Yorùbá scam explainer.
- **Open-source:** an open eval dataset plus a licence write-up gives us a shot at the Best Open-Source Practice award if we miss the top 3.
- **Feasible in 5 days:** one input → one verdict → one explanation → one voice note.

## Ideas kept as fallbacks
- **#2 (notices → voice notes)** uses the same pipeline (simplify + translate + TTS). If scam detection proves unreliable on Day 2, switch to this and keep about 70% of the code.
- **#3** is a strong future idea, but the healthcare safety rules make it riskier for a 5-day build.

## Kill criteria for Ṣọ́ra (check end of Day 2)
- Gemma 4 E4B gets fewer than ~75% of verdicts right on our eval set even after prompt work **and** the rules layer → fall back to #2.
- No TTS gives understandable Yorùbá → ship text-only Yorùbá and say so honestly (still viable).
