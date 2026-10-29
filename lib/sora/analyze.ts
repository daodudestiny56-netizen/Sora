import { unwrap } from "../ocr";
import { fuzzyGrounded, locateQuote } from "./grounding";
import { OCR_SYSTEM, OCR_USER, analysisSystem, analysisUser, parseModelJson, type ModelOutput } from "./prompt";
import { getProvider, resolveBackend, type ImageInput, type Provider } from "./providers";
import { hasHighSeverity, runRules } from "./rules";
import { templateExplanation } from "./templates";
import {
  LANGS,
  maxVerdict,
  type Analysis,
  type Backend,
  type Explanation,
  type FlagCategory,
  type Lang,
  type RedFlag,
  type Verdict,
} from "./types";

export const MAX_TEXT = 2000;

export interface AnalyzeInput {
  text?: string;
  image?: ImageInput;
}

export interface AnalyzeOptions {
  languages?: Lang[];
  backend?: Backend;
  /** Total time budget for model calls. USSD needs a short one. */
  timeoutMs?: number;
}

export class InputError extends Error {}

const CATEGORIES = new Set<FlagCategory>([
  "credential_request",
  "suspicious_link",
  "lookalike_sender",
  "urgency_threat",
  "new_number",
  "advance_fee",
  "too_good_to_be_true",
  "fake_credit_alert",
  "secrecy_pressure",
  "authority_impersonation",
  "off_channel_contact",
  "model_judgement",
]);

/**
 * Merge rule: the model decides, but rules set a floor, so the model (or a
 * prompt injection hidden in the message) can never turn a rules warning green.
 * - Any rules warning keeps at least "suspicious".
 * - A rules "likely scam" stays "likely scam" when the model also sees a problem, or when the rules
 *   score is 5+ whatever the model says.
 */
export function mergeVerdict(rulesVerdict: Verdict, rulesFlags: RedFlag[], modelVerdict: Verdict, rulesScore = 0): Verdict {
  let floor: Verdict = rulesVerdict === "no_red_flags" && !hasHighSeverity(rulesFlags) ? "no_red_flags" : "suspicious";
  if (rulesVerdict === "likely_scam" && (modelVerdict !== "no_red_flags" || rulesScore >= 5)) floor = "likely_scam";
  return maxVerdict(modelVerdict, floor);
}

/** Short, non-sensitive reason for a model failure; the full provider error is only logged on the server. */
export function failureCode(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("model call failed:", msg.slice(0, 300));
  if (/\b429\b|quota|rate/i.test(msg)) return "rate_limited";
  if (/abort|timeout|timed out/i.test(msg)) return "timeout";
  if (/not set/i.test(msg)) return "not_configured";
  return "model_error";
}

/** Keep model flags whose quote really exists in the text; drop the rest. */
export function groundFlags(text: string, model: ModelOutput): { kept: RedFlag[]; dropped: number } {
  const kept: RedFlag[] = [];
  let dropped = 0;
  for (const f of model.red_flags) {
    const span = locateQuote(text, f.quote);
    if (!span && !fuzzyGrounded(text, f.quote)) {
      dropped++;
      continue;
    }
    const category = CATEGORIES.has(f.category as FlagCategory) ? (f.category as FlagCategory) : "model_judgement";
    kept.push({
      category,
      quote: span ? text.slice(span.start, span.end) : f.quote,
      reason: f.reason || "Flagged by the model.",
      severity: f.severity,
      source: "model",
      ...(span && { span }),
    });
  }
  return { kept, dropped };
}

const overlaps = (a: RedFlag, b: RedFlag) =>
  !!a.span && !!b.span && a.span.start < b.span.end && b.span.start < a.span.end;

export async function analyze(input: AnalyzeInput, opts: AnalyzeOptions = {}): Promise<Analysis> {
  const started = Date.now();
  const langs = opts.languages?.length ? opts.languages : [...LANGS];
  const backend = resolveBackend(opts.backend);
  const timeoutMs = opts.timeoutMs ?? 45_000;

  let provider: Provider | null = null;
  let fallbackReason: string | undefined;
  try {
    provider = getProvider(backend);
  } catch (e) {
    fallbackReason = failureCode(e);
  }

  let text = (input.text ?? "").trim();
  if (input.image) {
    if (!provider) throw new InputError("Reading screenshots needs the model backend. Paste the text instead.");
    const raw = await provider.complete({
      system: OCR_SYSTEM,
      user: OCR_USER,
      image: input.image,
      maxTokens: 1024,
      timeoutMs: Math.min(timeoutMs, 25_000),
    });
    // Rejoin chat-bubble line wraps so split links and phrases still match rules.
    const ocr = unwrap(raw);
    if (!ocr || ocr === "NO_TEXT") throw new InputError("No readable text found in that image.");
    text = [text, ocr].filter(Boolean).join("\n\n");
  }
  if (!text) throw new InputError("Paste a message or upload a screenshot.");
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);

  const rules = runRules(text);
  let model: ModelOutput | null = null;
  if (provider) {
    try {
      model = await callModel(provider, text, langs, started + timeoutMs);
    } catch (e) {
      fallbackReason = failureCode(e);
    }
  }

  let verdict = rules.verdict;
  let flags = rules.flags;
  let dropped = 0;
  const explanations: Partial<Record<Lang, Explanation>> = {};

  if (model) {
    verdict = mergeVerdict(rules.verdict, rules.flags, model.verdict, rules.score);
    const grounded = groundFlags(text, model);
    dropped = grounded.dropped;
    // Rules first: they carry fixed, reviewed reasons. Add model flags that point somewhere new.
    flags = [...rules.flags, ...grounded.kept.filter((m) => !rules.flags.some((r) => overlaps(r, m)))];
    // Use the model's wording only when it agrees with the final verdict and the rules didn't object;
    // otherwise the reviewed templates speak, so injected text can't shape the explanation.
    if (verdict === model.verdict && !(rules.verdict !== "no_red_flags" && model.verdict === "no_red_flags")) {
      for (const l of langs) {
        const e = model.explanations[l];
        if (e?.summary) explanations[l] = { summary: e.summary.trim(), actions: e.actions.slice(0, 3) };
      }
    }
  }
  for (const l of langs) explanations[l] ??= templateExplanation(l, verdict, flags);

  flags.sort((a, b) => (a.span?.start ?? Infinity) - (b.span?.start ?? Infinity));

  return {
    verdict,
    scamType: model?.scam_type && verdict !== "no_red_flags" ? model.scam_type : null,
    redFlags: flags,
    explanations,
    text,
    engine: {
      backend: model ? backend : "rules",
      model: model ? provider!.model : null,
      ...(fallbackReason && backend !== "rules" && { fallbackReason }),
      rulesVerdict: rules.verdict,
      modelVerdict: model?.verdict ?? null,
      droppedFlags: dropped,
      latencyMs: Date.now() - started,
    },
  };
}

/** `deadline` is an absolute time: every call, including the repair retry, shares one budget. */
async function callModel(provider: Provider, text: string, langs: Lang[], deadline: number): Promise<ModelOutput> {
  const left = () => Math.max(3_000, deadline - Date.now());
  const req = {
    system: analysisSystem(langs),
    user: analysisUser(text, langs),
    maxTokens: 400 + 350 * langs.length,
  };
  const raw = await provider.complete({ ...req, timeoutMs: left() });
  try {
    return parseModelJson(raw);
  } catch (e) {
    // One repair attempt: small models occasionally break JSON on long multilingual output.
    if (deadline - Date.now() < 4_000) throw e;
    const retry = await provider.complete({ ...req, user: `${req.user}\n\nReturn ONLY valid JSON this time.`, timeoutMs: left() });
    return parseModelJson(retry);
  }
}
