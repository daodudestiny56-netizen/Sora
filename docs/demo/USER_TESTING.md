# User testing and native-speaker review

Two short studies to run before Demo Day. Together they turn "we think it helps" into evidence, and
they find language errors before judges do.

## A. Parent test (5–10 people, about 15 minutes each)
**Who:** parents, aunties, uncles or grandparents, ideally a mix of Yorùbá-, Hausa-, Igbo- and
Pidgin-first speakers, and at least two with button phones.

**Consent (read aloud):** "We're students testing an app that checks scam messages. We'll show you some
messages and ask what you think. We won't record your name or phone number, and you can stop at any
time. Is that OK?"

### Steps
1. **Before Ṣọ́ra.** Show 4 printed or on-screen messages from the practice game (2 scams, 2 real).
   For each, ask: "Is this real or a scam? What would you do?" Write down their answer and reason.
2. **With Ṣọ́ra.** Check the same 4 messages in Ṣọ́ra in their preferred language. If voice notes are live,
   play one.
3. **Ask:**
   - "In your own words, what did Ṣọ́ra tell you to do?" (checks understanding)
   - "Was the language clear? Any word that sounded wrong?" (write the exact word)
   - "Would you trust this over a message from your 'bank'? Why?"
   - Button-phone users: try the USSD simulator, or describe the menu. "Could you do this on your phone?"
4. **Rate (1–5):** How easy was it? How much do you trust it? Would you use it again?

### Record (one row per person, no names)
| # | Language | Phone type | Correct before (of 4) | Correct after (of 4) | Easy (1–5) | Trust (1–5) | Quote | Language problems noticed |
|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | |

**Report** the before/after scores and 2–3 quotes on the Problem slide and in the README. If anyone
shares a real scam message, ask permission, anonymise it (see CONTRIBUTING.md), and add it to the
eval set.

## B. Native-speaker rating (1 rater per language, about 30 minutes)
For each of Yorùbá, Hausa, Igbo and Pidgin:

1. Run `npm run eval -- --backend gemini --langs en,<code> --limit 30` and open
   `eval/results/gemini_gemma-4-26b-a4b-it.json`. Or check 30 messages in the app with that language tab open.
2. For each explanation, the rater scores:
   - **Correctness (1–5):** does it say the right thing about the message?
   - **Naturalness (1–5):** does it sound like a fluent speaker? Are tone marks / special letters right?
   - **Harmful error (yes/no):** anything misleading or alarming (e.g. a wrong word that changes the meaning)?
3. The rater also reads every string in `lib/sora/templates.ts`, `lib/sora/channels.ts` and
   `lib/quiz.ts` for their language and suggests fixes.

| Language | Rater (initials) | Mean correctness | Mean naturalness | Harmful errors (of 30) |
|---|---|---|---|---|
| Yorùbá | | | | |
| Hausa | | | | |
| Igbo | | | | |
| Pidgin | | | | |

**Report** this table in README §8 exactly as measured. If harmful errors show up for a language, switch
that language's explanations to the reviewed templates (a small code change) and say so.
