# Ṣọ́ra eval set (`eval.jsonl`)

150 short messages of the kind Nigerian families receive by SMS and WhatsApp:
**89 scams** and **61 legitimate messages** (bank debit/credit alerts, OTPs the user asked for,
delivery notices, family texts). Legitimate messages are included on purpose. A checker that calls
everything a scam is useless, so we measure false alarms as carefully as missed scams.

| Field | Meaning |
|---|---|
| `id` | Stable id (`e001`…) |
| `label` | `scam` or `legit` |
| `scam_type` | `bvn_phishing`, `fake_credit_alert`, `new_number`, `fake_grant`, `prize`, `investment`, `job`, `loan`, `delivery`, `impersonation`, `romance`, `other`, or `null` for legit |
| `lang` | `en` 121 · `pcm` 10 · `yo` 8 · `ha` 6 · `ig` 5 |
| `source` | `synthetic-from-public-patterns` for every item (see below) |
| `text` | The message |

## How it was made
- Every message was **written by the team** from scam formats described in public warnings (CBN,
  bank fraud advisories and Nigerian tech press; sources in `docs/planning/01-RESEARCH.md`) and from
  the shape of real alerts we receive. Drafting was AI-assisted. Each item is checked by a team member before it is used to report results.
- **No real personal data.** Names are common placeholders, account numbers are masked
  (`22****871`), and phone numbers are clearly fake (`08000000001`, `0700 000 0000`).
- Yorùbá, Hausa and Igbo items are short and still need review by native speakers.

## Known limits
- It is synthetic, small, and mostly English. It measures whether the pipeline catches known patterns,
  not how it performs on the full variety of real-world scams.
- The rules engine was revised twice after looking at its misses on this set, so **rules-only numbers
  are optimistic**. Model prompts were not tuned on it.
- Contributions of real, anonymised messages are welcome. See `CONTRIBUTING.md`.

## Held-out set (`holdout.jsonl`)
50 messages (30 scam, 20 legitimate; 43 English, 7 Pidgin) written after the rules were frozen, to check
how the rules do on wording they were not built for. They are synthetic and AI-assisted like `eval.jsonl`
(`source` is `synthetic-holdout-ai-assisted`), with fake numbers and no personal data. Same fields as
`eval.jsonl`. Rules-only result: 43.3% scam recall, 26.7% strict recall, 5.0% false alarms, 64.0% accuracy
(`eval/results/rules.holdout.json`).

**Rules for this file:** never add its messages to `eval.jsonl`, and never change a rule because of a miss
here. If you do, this file stops being a held-out set, so start a new one from fresh messages. Real,
anonymised messages from parent testing (with permission) belong in a new file such as
`data/holdout-real.jsonl`, not in this one.

```
npm run eval -- --data data/holdout.jsonl                       # rules only
npm run eval -- --backend gemini --data data/holdout.jsonl      # Gemma 4 + rules (needs a Gemini key)
```

A run on another file, or with `--limit`, writes its own file in `eval/results/` and leaves
`summary.json` (the README table and the website) untouched.

Licence: CC BY 4.0.
