# 04 — Build plan, demo script, submission

Split: **A = model / eval / backend**, **B = data / UI / docs / demo**. Both must be able to explain everything (the rules require it).

## Day-by-day
### Day 1 — Sun Oct 25: define + data
- [ ] Create the GitHub repo (MIT or Apache-2.0), `.gitignore`, `.env.example`, README skeleton
- [ ] A: install Ollama, pull Gemma 4 E4B, hello-world prompt; request N-ATLaS gated access
- [ ] B: start `data/eval.jsonl` — collect 100+ messages (public warnings, own phones anonymised, legit alerts)
- [ ] Both: write the rules list (red-flag patterns) from the research

### Day 2 — Mon Oct 26: experiment with models
- [ ] A: eval script (`python -m sora.eval --backend ollama`), run Gemma 4 E4B on the eval set
- [ ] A: try N-ATLaS (Colab/Kaggle 4-bit) and Qwen on the same set
- [ ] B: test YarnGPT2 Yorùbá on 10 sentences; check tone-mark needs and CPU speed
- [ ] B: test screenshot OCR on 10 bank-alert screenshots
- [ ] **End of day: go/no-go** against the kill criteria in 02-CONCEPTS.md

### Day 3 — Tue Oct 27: build the core
- [ ] A: pipeline — rules → model JSON → merge → grounding check
- [ ] A: hosted backend option for the public link
- [ ] B: Gradio UI — input, verdict card, highlighted phrases, EN/Pidgin/Yorùbá tabs, audio player
- [ ] End of day: the full loop works on the 3 demo messages

### Day 4 — Wed Oct 28: test + document
- [ ] Re-run the eval and fill the results table; native-speaker Yorùbá ratings
- [ ] Fix the top failures (prompt + rules)
- [ ] README: problem, users, demo, setup, model + why, eval, limitations, licences, acknowledgements, AI-assist disclosure
- [ ] Deploy (HF Space or similar); test on a phone

### Day 5 — Thu Oct 29: finalise + submit
- [ ] Fresh-clone test of the setup instructions on the other person's laptop
- [ ] Record a 2–3 min backup demo video
- [ ] Slides (5–6 max)
- [ ] **Submit by 8 PM WAT**; recheck all links in incognito

## Demo Day script (Oct 31)
**Slides (3 min):**
1. A real (anonymised) screenshot from one of our parents' phones. "This is how it starts."
2. Who: the family tech-support student + the Yorùbá-first parent.
3. Ṣọ́ra in one line + the architecture picture.
4. Model choice: comparison table (Gemma 4 vs N-ATLaS vs Qwen) + licence notes.
5. Limitations + next steps.

**Live demo (5 min):**
1. Paste a "BVN blocked — click link" SMS → **Likely scam**, phrases highlighted, play the Yorùbá voice note.
2. Paste a **real** bank debit alert → **No red flags found** (shows it isn't paranoid).
3. Upload a fake credit-alert screenshot → caught; action: "check your balance in the app".
4. Show the repo: README, eval command, results table.
Backup: the recorded video ready in a tab; local Ollama running in case the hosted link is slow.

## Submission checklist (matches the form)
- [ ] Project name: Ṣọ́ra
- [ ] Team: both full names + universities
- [ ] Problem statement (3–4 sentences, from PRD §1)
- [ ] Solution description (from PRD §3)
- [ ] GitHub link (public, tested logged-out)
- [ ] Working demo link + video + run instructions
- [ ] Model info: Gemma 4 E4B + YarnGPT2, roles, why, limitations
- [ ] README with setup, dependencies, reproduction
- [ ] Acknowledgements: model licences, datasets, reused code, AI coding assistant use

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Yorùbá text quality poor | Med | Native-speaker review; rules-based Yorùbá templates for actions; state the limits |
| YarnGPT2 slow on CPU | Med | Pre-generate audio for demo messages as backup; GPU Space if available |
| Hosted demo down at judging | Med | Clear local instructions + video |
| False alarms on real alerts | Med | Legit messages in the eval; tune; report the rate |
| Overclaiming | Low if careful | Only report measured numbers |
| Personal data leak in dataset | Low | Anonymise every item; review before each push |
