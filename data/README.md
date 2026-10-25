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
  the shape of real alerts we receive. Drafting was AI-assisted, and we reviewed every item.
- **No real personal data.** Names are common placeholders, account numbers are masked
  (`22****871`), and phone numbers are clearly fake (`08000000001`, `0700 000 0000`).
- Yorùbá, Hausa and Igbo items are short and still need review by native speakers.

## Known limits
- It is synthetic, small, and mostly English. It measures whether the pipeline catches known patterns,
  not how it performs on the full variety of real-world scams.
- The rules engine was revised once after looking at its misses on this set, so **rules-only numbers
  are optimistic**. Model prompts were not tuned on it.
- Contributions of real, anonymised messages are welcome. See `CONTRIBUTING.md`.

Licence: CC BY 4.0.
