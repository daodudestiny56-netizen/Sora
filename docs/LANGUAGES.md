# Languages in Ṣọ́ra

| Code | Language | Where it appears | Status |
|---|---|---|---|
| `en` | English | Web, voice, USSD, SMS | Reviewed |
| `pcm` | Nigerian Pidgin | Web, voice (English voice), USSD, SMS | Needs native review |
| `yo` | Yorùbá | Web (full tone marks), voice, USSD/SMS (marks folded) | **Needs native review** |
| `ha` | Hausa | Web (hooked letters), voice, USSD/SMS (folded) | **Needs native review** |
| `ig` | Igbo | Web (dot-below vowels), voice, USSD/SMS (folded) | **Needs native review** |

## Two sources of text
1. **Gemma 4 output.** The prompt asks for each language with its proper orthography. Quality varies
   and is lower for Yorùbá, Hausa and Igbo than for English.
2. **Templates** (`lib/sora/templates.ts`). Short, fixed sentences used when the model is unavailable,
   when the rules raise the model's verdict (so the wording matches the final verdict), and for every
   USSD/SMS reply. Fixed text can be reviewed once and trusted.

## Review plan
- A native speaker of each language checks every template string and edits it in a PR.
- For model output, a native speaker rates 30 explanations per language from 1 to 5 for correctness and
  naturalness. We report it as a human rating, not a benchmark.

## Adding a language
Add the code to `LANGS` in `lib/sora/types.ts`, add a guide line in `lib/sora/prompt.ts`, add rows in
every table in `lib/sora/templates.ts` and the USSD menu in `lib/sora/channels.ts`, and map a voice in
`services/voice/app.py`. TypeScript will show every place that still needs a string.
