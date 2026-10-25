# Contributing to Ṣọ́ra

Thank you! The most valuable contributions right now:

1. **Native-speaker review** of Yorùbá, Hausa, Igbo or Pidgin text in `lib/sora/templates.ts` and
   `lib/sora/channels.ts`. Small PRs that fix one table are perfect.
2. **Scam examples** for `data/eval.jsonl`. **Anonymise everything:** replace names with common
   placeholders, mask account numbers (`22****871`) and use fake phone numbers (`08000000001`). Never
   submit real people's data. Add legitimate examples too; false alarms matter.
3. **Rules** in `lib/sora/rules.ts` for new scam formats, each with a test in `tests/rules.test.ts`
   that shows a hit *and* a legitimate message it must not flag.

## Workflow
```bash
npm install
npm test && npm run typecheck && npm run lint
npm run eval     # include before/after numbers in your PR if you change rules or prompts
```
Keep commits small and focused, with messages in the form `feat(scope): …`, `fix(scope): …`,
`docs: …`, `test: …`.

## Code of conduct
Be kind and assume good faith. Never post real scam victims' personal details in issues or PRs.
