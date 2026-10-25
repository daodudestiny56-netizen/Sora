import { runRules } from "./rules";
import { templateExplanation } from "./templates";
import { LANGS, type Analysis, type Explanation, type Lang } from "./types";

/**
 * Offline check that runs entirely in the browser: the same rules and reviewed
 * templates the server falls back to, so a phone with no data still gets an answer.
 */
export function analyzeLocally(text: string): Analysis {
  const started = performance.now();
  const clean = text.trim().slice(0, 2000);
  const rules = runRules(clean);
  const explanations: Partial<Record<Lang, Explanation>> = {};
  for (const l of LANGS) explanations[l] = templateExplanation(l, rules.verdict, rules.flags);
  return {
    verdict: rules.verdict,
    scamType: null,
    redFlags: rules.flags,
    explanations,
    text: clean,
    engine: {
      backend: "rules",
      model: null,
      fallbackReason: "offline",
      rulesVerdict: rules.verdict,
      modelVerdict: null,
      droppedFlags: 0,
      latencyMs: Math.round(performance.now() - started),
    },
  };
}
