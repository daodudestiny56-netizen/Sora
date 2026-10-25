# Demo Day script (Sat Oct 31, 4:00 PM WAT · 8-minute slot)

**Format:** 3 minutes of slides, then a 5-minute live demo. One person talks, the other drives the demo,
and both must be able to answer questions on any part.

## Before the call (T-60 min)
- [ ] Open https://sora-ecru-kappa.vercel.app in Chrome and check the badge says **Gemma 4 live**.
- [ ] Check each sample message once (this warms up the serverless functions).
- [ ] If the voice service is deployed: play the Yorùbá voice note for "BVN blocked" once to wake the Space.
- [ ] Android phone: Ṣọ́ra installed from the site; a test scam SMS ready in Messages; screen mirroring on.
- [ ] WhatsApp (if Twilio is set up): your phone has joined the sandbox; test one message.
- [ ] Backup video open in a tab. Local copy running (`npm run dev`) in case the live site is slow.
- [ ] Close notifications. Zoom the browser to 125%.

## Slides (3 min)
| # | Slide | Say (about 30 s each) |
|---|---|---|
| 1 | **The problem**: an anonymised scam screenshot from a parent's phone | "This is how it starts. Every family here has received one. The person most at risk reads English slowly, trusts anything that looks official, and has nobody to ask in the moment." |
| 2 | **Who it's for**: the family tech-support student and the Yorùbá-, Hausa- or Igbo-first parent, often on a button phone | "We are the fraud desk for our families, usually after the money is gone." |
| 3 | **Ṣọ́ra in one line** + the channels (web/app, WhatsApp, USSD/SMS, offline) | "Ṣọ́ra points at the exact words that give a scam away and tells your parents what to do in their language, on whatever phone they have." |
| 4 | **The model**: Gemma 4 + rules + grounding; why not N-ATLaS (licence cap, no images) | "The model can raise a verdict, but it can never clear a PIN request, and it can't invent evidence: every quote must exist in the message." |
| 5 | **Results and honesty**: 98.9% scam recall, 1.6% false alarms, 100% grounding; what failed and why; limits | "We report the failures too. Six API errors fell back to rules, and our Yorùbá and Igbo still need native-speaker review." |

## Live demo (5 min)
1. **BVN phishing (45 s).** Click *BVN blocked* → **Likely scam**. Point at the highlighted phrases and
   the "rule" vs "gemma" tags. Switch to **Yorùbá**, then **Hausa**. Play the voice note if it's live.
2. **Real alert (30 s).** Click *Real debit alert* → **No red flags found, still confirm with your bank**.
   "It doesn't cry wolf: 1 false alarm in 61 real messages."
3. **Screenshot (45 s).** Upload a fake credit-alert screenshot → Gemma reads it → "Check your balance in
   your bank app, not the SMS."
4. **Share from the phone (45 s).** On Android, long-press the scam SMS → Share → Ṣọ́ra → verdict.
   Turn on airplane mode and check another one: "No data? It still works."
5. **Button phone (45 s).** Scroll to the simulator: dial `*384*7672#` → Hausa → Check a message → type
   key words → verdict on one screen. "Same engine, 182 characters, no tone marks so any phone shows it."
6. **WhatsApp (30 s, if set up).** Forward a scam to the sandbox number and show the reply arriving.
7. **Practice (30 s).** Play two rounds of *Scam or real?* in Yorùbá.
8. **Close (15 s).** Show the README feature-status table and `npm run eval`. "Everything is open:
   code, data and eval."

## Likely questions
| Question | Answer |
|---|---|
| Why Gemma 4 and not N-ATLaS? | N-ATLaS's licence caps use at 1,000 monthly users without a commercial licence, it can't read images, and its own card rates Yorùbá its weakest language. Gemma 4 is Apache 2.0, reads screenshots, and runs on a laptop (E4B). |
| Is the eval data real? | Synthetic, written from public scam warnings, with no personal data. We say so in the dataset card, and the rules numbers are optimistic because we tuned the rules twice on it. |
| How do you stop hallucinations? | Grounding: every red flag must quote the message word for word or it is dropped. 100% of quotes were grounded on our eval. Rules also set a floor under the verdict. |
| What about privacy? | Nothing is stored. Messages are processed in memory. The offline mode and local Gemma (Ollama) keep everything on the device. |
| How would this reach real users? | WhatsApp needs a Meta-approved number, and USSD/SMS need a paid shortcode via Africa's Talking. A bank, telco or NGO sponsor is the realistic path. |
| How good is the Yorùbá? | Honestly, not yet verified. We saw errors in testing, so native-speaker review is our first next step. |
| What did the AI assistant do? | We disclose it in the README. We directed the work, tested it, and can explain every part. |
