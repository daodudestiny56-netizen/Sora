import type { FlagCategory, RedFlag, Severity, Verdict } from "./types";

/**
 * Deterministic red-flag rules for Nigerian scam messages.
 *
 * Rules are the safety net under the model: they are cheap, explainable and
 * cannot hallucinate. Every rule must point at an exact span of the input.
 * Patterns come from CBN / bank guidance ("we will never ask for your PIN,
 * OTP or BVN") and from the scam formats listed in docs/planning/01-RESEARCH.md.
 */

interface Rule {
  category: FlagCategory;
  severity: Severity;
  reason: string;
  pattern: RegExp;
  /** Return false to discard a match (e.g. "do NOT share your OTP"). */
  accept?: (text: string, match: RegExpExecArray) => boolean;
}

const SECRETS =
  "(?:otp|o\\.t\\.p|one[- ]time (?:password|pin|code)|pin|bvn|nin|password|passcode|token|cvv|card (?:details|number)|atm card|verification code|security code|login details)";

const NEGATION = /\b(?:do not|don't|dont|never|no go|not|no)\b[^.!?\n]{0,30}$/i;

/** Text a bank or app legitimately sends next to an OTP: "Do not share", "If you didn't request". */
const notNegated = (text: string, m: RegExpExecArray) =>
  !NEGATION.test(text.slice(Math.max(0, m.index - 40), m.index));

const OFFICIAL_DOMAINS = [
  "cbn.gov.ng",
  "efcc.gov.ng",
  "ncc.gov.ng",
  "nimc.gov.ng",
  "firs.gov.ng",
  "gtbank.com",
  "firstbanknigeria.com",
  "accessbankplc.com",
  "zenithbank.com",
  "ubagroup.com",
  "opayweb.com",
  "palmpay.com",
  "kuda.com",
  "moniepoint.com",
  "stanbicibtc.com",
  "fidelitybank.ng",
  "wemabank.com",
  "sterling.ng",
  "jumia.com.ng",
  "gigl.com.ng",
];

const SHORTENERS =
  /\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd|shorturl\.at|tiny\.cc|ow\.ly|rebrand\.ly|s\.id|wa\.link|linktr\.ee)\b/i;

const isOfficialHost = (host: string) =>
  OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));

const BANKS =
  "(?:first ?bank|gtb|gt ?bank|guaranty|access|zenith|uba|opay|palm ?pay|kuda|moniepoint|stanbic|fidelity|wema|sterling|fcmb|union ?bank|polaris|ecobank|cbn|efcc|nimc|ncc)";

const RULES: Rule[] = [
  // --- credentials ------------------------------------------------------
  {
    category: "credential_request",
    severity: "high",
    reason: "Asks for a PIN, OTP, BVN, password or card details. Banks never ask for these by text or chat.",
    pattern: new RegExp(
      `\\b(?:send|share|reply(?: with)?|provide|enter|input|submit|forward|give|tell us|confirm|update|verify|re-?validate|link|drop)\\b[^.!?\\n]{0,40}\\b${SECRETS}\\b`,
      "gi",
    ),
    accept: notNegated,
  },
  {
    // Yorùbá ("fi ... ránṣẹ́"), Hausa ("turo/aiko"), Igbo ("zitere/ziga/nye") requests for a secret.
    category: "credential_request",
    severity: "high",
    reason: "Asks for a PIN, OTP, BVN or secret code. Banks never ask for these by text or chat.",
    pattern: /(?:\b(?:otp|bvn|pin|password)\b|kóòdù|lambar sirri)[^.!?\n]{0,50}(?:ránṣẹ́|ransẹ|ranṣẹ)|\b(?:turo|aiko|aika|zitere|ziga|nye)\b[^.!?\n]{0,40}(?:\b(?:otp|bvn|pin|password)\b|lambar sirri)/gi,
  },
  {
    category: "credential_request",
    severity: "high",
    reason: "Asks you to send back a code you just received. That code is the key to your account.",
    pattern: /\b(?:code|otp)\b[^.!?\n]{0,30}\b(?:sent to|you (?:just )?(?:received|got))\b[^.!?\n]{0,30}\b(?:send|forward|reply|give)\b/gi,
  },

  // --- links ------------------------------------------------------------
  {
    category: "suspicious_link",
    severity: "medium",
    reason: "Uses a link shortener that hides where the link really goes.",
    pattern: new RegExp(SHORTENERS.source, "gi"),
  },
  {
    category: "suspicious_link",
    severity: "medium",
    reason: "Link is not on the bank or agency's official website.",
    pattern: /\b(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+(?:com|ng|net|org|info|xyz|top|site|online|link|click|live|vip|shop|cc|io|me|app|com\.ng|gov\.ng))(?:\/[^\s]*)?/gi,
    accept: (text, m) => {
      const host = m[1].toLowerCase();
      if (isOfficialHost(host) || SHORTENERS.test(host)) return false;
      // Only flag look-alike hosts that borrow a bank/agency/"verify" word; plain links are left to the model.
      return new RegExp(`${BANKS}|bvn|verify|verification|update|secure|alert|grant|empowerment|reward|promo|login`, "i").test(host);
    },
  },

  // --- sender spoofing --------------------------------------------------
  {
    category: "lookalike_sender",
    severity: "medium",
    reason: "Sender name copies a bank or agency but adds extra words. Real alerts use one fixed sender ID.",
    pattern: new RegExp(
      `\\b${BANKS}[-_ .]?(?:alertz?s?|secure|support|update|verify|verification|care|online|team|desk|notice|info)\\b`,
      "gi",
    ),
  },

  // --- pressure ---------------------------------------------------------
  {
    category: "urgency_threat",
    severity: "medium",
    reason: "Threatens to block, suspend or restrict your account to rush you.",
    pattern: /\b(?:account|bvn|card|line|sim|wallet|nin)\b[^.!?\n]{0,40}\b(?:blocked|block|suspended|suspend|restricted|restrict|deactivated|deactivate|frozen|freeze|barred|disabled|closed)\b/gi,
    accept: (text, m) => !/\b(?:was|have been) (?:successfully )?(?:unblocked|reactivated)\b/i.test(m[0]),
  },
  {
    category: "urgency_threat",
    severity: "low",
    reason: "Creates a short deadline so you act before thinking.",
    pattern: /\b(?:within (?:the next )?\d{1,2} ?(?:hours?|hrs?|minutes?|mins?)|immediately|urgent(?:ly)?|right now|today only|last warning|final notice|act now|asap)\b/gi,
  },

  // --- relationship scams -----------------------------------------------
  {
    category: "new_number",
    severity: "medium",
    reason: "\"This is my new number\" is the opening of the family-emergency scam.",
    // Yorùbá/Hausa/Igbo phrases end in non-ASCII letters, so they sit outside the \b group.
    pattern: /\b(?:(?:this is|na) my new (?:number|line)|i (?:have )?changed my (?:number|line)|save (?:this|my) (?:new )?number|my (?:old )?(?:phone|line) (?:got|was) (?:stolen|spoilt|spoiled|lost|damaged))\b|nọ́mbà (?:mi )?tuntun|sabuwar lamba|lambar waya ta sabuwa|nọmba (?:m )?ọhụrụ/gi,
  },
  {
    category: "secrecy_pressure",
    severity: "medium",
    reason: "Asks you to keep it secret or not to call. Scammers isolate you from people who would warn you.",
    pattern: /\b(?:don'?t tell (?:anyone|anybody|daddy|mummy|dad|mum)|keep (?:this|it) (?:secret|between us|confidential)|no tell anybody|don'?t call (?:me|my old number)|i can'?t (?:talk|call) now|i no fit (?:talk|call))\b/gi,
  },

  // --- money ------------------------------------------------------------
  {
    category: "advance_fee",
    severity: "high",
    reason: "Asks you to pay a fee before you receive money. Real grants, loans and prizes don't do this.",
    pattern: /\b(?:pay|send|transfer)\b[^.!?\n]{0,40}\b(?:processing|registration|activation|delivery|clearance|release|verification|admin(?:istrative)?|form|insurance|tax|logistics|unlocking|customs|upgrade|documentation)\s+(?:fee|charge|levy)\b|\b(?:processing|registration|activation|clearance|release|unlocking|upgrade) fee\b/gi,
  },
  {
    category: "advance_fee",
    severity: "high",
    reason: "Asks you to pay first so you can claim, receive or unlock something.",
    pattern: /\b(?:pay|send|deposit(?:ing)?)\b[^.!?\n]{0,40}\bto (?:claim|receive|release|unlock|start|get your|activate|redeem)\b|\bkuɗin rajista\b|owó ìforúkọsílẹ̀|ụgwọ ndebanye aha/gi,
  },
  {
    category: "too_good_to_be_true",
    severity: "medium",
    reason: "Promises free money, a grant or a prize you never applied for.",
    pattern: /\b(?:you (?:have )?won|congratulations?[!,.]? you|selected (?:for|as a beneficiary)|beneficiar(?:y|ies)|empowerment (?:grant|fund|programme|program|scheme)|(?:fg|federal government|cbn|tinubu|presidential)[^.!?\n]{0,25}(?:grant|palliative|empowerment|giveaway|support fund)|free (?:data|airtime|money|cash)|claim your (?:prize|reward|grant|bonus)|double your money|guaranteed (?:returns?|profit)|\d{1,3}% (?:daily|weekly) (?:returns?|profit|interest))\b/gi,
  },
  {
    category: "fake_credit_alert",
    severity: "high",
    reason: "Says money was sent \"by mistake\" and asks you to return it. Fake alerts are made to look exactly like real ones.",
    pattern: /\b(?:sent|transferred|paid|credited)\b[^.!?\n]{0,40}\b(?:by mistake|mistakenly|in error|wrongly|to the wrong (?:account|number))\b|\b(?:mistakenly|wrongly) (?:sent|transferred|credited)\b|\b(?:refund|return|reverse|send back)\b[^.!?\n]{0,30}\b(?:the (?:money|balance|excess)|it back|my money)\b/gi,
  },

  // --- impersonation / off-channel ---------------------------------------
  {
    category: "authority_impersonation",
    severity: "medium",
    reason: "Claims to be from the CBN, EFCC, police or another agency. They don't contact people this way.",
    pattern: /\b(?:central bank of nigeria|cbn|efcc|economic and financial crimes|nigeria police|dss|nimc|ncc|firs|interpol|federal ministry)\b[^.!?\n]{0,60}\b(?:arrest|warrant|investigation|fine|penalt(?:y|ies)|verify|verification|grant|approved|link|bvn|nin|suspend)/gi,
  },
  {
    category: "off_channel_contact",
    severity: "low",
    reason: "Pushes you to call or WhatsApp a private number instead of your bank's official line.",
    pattern: /\b(?:call|whatsapp|chat with|contact|text)\b[^.!?\n]{0,25}\b(?:our )?(?:agent|officer|manager|customer care|support|admin|this number|on)\b[^.!?\n]{0,12}(?:\+?234|0)[789][01]\d[ -]?\d{3,4}[ -]?\d{3,4}/gi,
  },
];

const WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 4 };

export interface RulesResult {
  flags: RedFlag[];
  score: number;
  verdict: Verdict;
}

export function runRules(text: string): RulesResult {
  const flags: RedFlag[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text))) {
      if (m[0].length === 0) {
        rule.pattern.lastIndex++;
        continue;
      }
      if (rule.accept && !rule.accept(text, m)) continue;
      const span = { start: m.index, end: m.index + m[0].length };
      const overlaps = flags.some(
        (f) => f.category === rule.category && f.span && span.start < f.span.end && f.span.start < span.end,
      );
      const key = `${rule.category}:${m[0].toLowerCase()}`;
      if (overlaps || seen.has(key)) continue;
      seen.add(key);
      flags.push({
        category: rule.category,
        severity: rule.severity,
        reason: rule.reason,
        quote: m[0].trim(),
        source: "rules",
        span,
      });
    }
  }

  flags.sort((a, b) => (a.span?.start ?? 0) - (b.span?.start ?? 0));
  const categories = new Map<FlagCategory, Severity>();
  for (const f of flags) {
    const prev = categories.get(f.category);
    if (!prev || WEIGHT[f.severity] > WEIGHT[prev]) categories.set(f.category, f.severity);
  }
  // Score each category once so ten urgency words don't outweigh one PIN request.
  const score = [...categories.values()].reduce((s, sev) => s + WEIGHT[sev], 0);
  return { flags, score, verdict: scoreToVerdict(score, categories) };
}

function scoreToVerdict(score: number, categories: Map<FlagCategory, Severity>): Verdict {
  const hasHigh = [...categories.values()].includes("high");
  if (hasHigh || score >= 5) return "likely_scam";
  if (score >= 2) return "suspicious";
  return "no_red_flags";
}

export const hasHighSeverity = (flags: RedFlag[]) =>
  flags.some((f) => f.source === "rules" && f.severity === "high");
