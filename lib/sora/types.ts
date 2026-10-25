export const LANGS = ["en", "pcm", "yo", "ha", "ig"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  pcm: "Pidgin",
  yo: "Yorùbá",
  ha: "Hausa",
  ig: "Igbo",
};

export const VERDICTS = ["no_red_flags", "suspicious", "likely_scam"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type Severity = "low" | "medium" | "high";

export type FlagCategory =
  | "credential_request"
  | "suspicious_link"
  | "lookalike_sender"
  | "urgency_threat"
  | "new_number"
  | "advance_fee"
  | "too_good_to_be_true"
  | "fake_credit_alert"
  | "secrecy_pressure"
  | "authority_impersonation"
  | "off_channel_contact"
  | "model_judgement";

export interface Span {
  start: number;
  end: number;
}

export interface RedFlag {
  category: FlagCategory;
  quote: string;
  reason: string;
  severity: Severity;
  source: "rules" | "model";
  span?: Span;
}

export interface Explanation {
  summary: string;
  actions: string[];
}

export type Backend = "gemini" | "openai" | "rules";

export interface Analysis {
  verdict: Verdict;
  scamType: string | null;
  redFlags: RedFlag[];
  explanations: Partial<Record<Lang, Explanation>>;
  /** Text that was analysed: the pasted message, or the text read from a screenshot. */
  text: string;
  engine: {
    backend: Backend;
    model: string | null;
    /** Set when the model was requested but failed, so the result came from rules only. */
    fallbackReason?: string;
    rulesVerdict: Verdict;
    modelVerdict: Verdict | null;
    droppedFlags: number;
    latencyMs: number;
  };
}

export const verdictRank = (v: Verdict) => VERDICTS.indexOf(v);
export const maxVerdict = (a: Verdict, b: Verdict): Verdict =>
  verdictRank(a) >= verdictRank(b) ? a : b;
