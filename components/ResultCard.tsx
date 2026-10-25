"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle,
  Copy,
  DownloadSimple,
  Pause,
  Play,
  ShieldWarning,
  SpeakerHigh,
  WarningOctagon,
  WhatsappLogo,
} from "@phosphor-icons/react";
import clsx from "clsx";
import { LANGS, LANG_NAMES, type Analysis, type Lang, type RedFlag, type Verdict } from "@/lib/sora/types";
import { EASE } from "./ui";

const VERDICT: Record<Verdict, { label: string; sub: string; color: string; soft: string; Icon: typeof ShieldWarning }> = {
  likely_scam: {
    label: "Likely scam",
    sub: "Don't reply, click or pay.",
    color: "text-vermilion",
    soft: "bg-vermilion-soft",
    Icon: WarningOctagon,
  },
  suspicious: {
    label: "Suspicious",
    sub: "Confirm before you act.",
    color: "text-ochre",
    soft: "bg-ochre-soft",
    Icon: ShieldWarning,
  },
  no_red_flags: {
    label: "No red flags found",
    sub: "Still confirm with your bank directly.",
    color: "text-forest",
    soft: "bg-forest-soft",
    Icon: CheckCircle,
  },
};

const SEV_RANK = { high: 3, medium: 2, low: 1 } as const;

function Highlighted({ text, flags }: { text: string; flags: RedFlag[] }) {
  const parts = useMemo(() => {
    const spans = flags
      .filter((f) => f.span)
      .sort((a, b) => a.span!.start - b.span!.start || SEV_RANK[b.severity] - SEV_RANK[a.severity]);
    const out: { t: string; sev?: RedFlag["severity"]; reason?: string }[] = [];
    let i = 0;
    for (const f of spans) {
      const { start, end } = f.span!;
      if (end <= i) continue;
      const s = Math.max(start, i);
      if (s > i) out.push({ t: text.slice(i, s) });
      out.push({ t: text.slice(s, end), sev: f.severity, reason: f.reason });
      i = end;
    }
    if (i < text.length) out.push({ t: text.slice(i) });
    return out;
  }, [text, flags]);

  return (
    <p className="whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-ink-soft">
      {parts.map((p, k) =>
        p.sev ? (
          <mark key={k} title={p.reason} className={clsx("rounded-[3px] px-0.5 text-ink", `hl-${p.sev}`)}>
            {p.t}
          </mark>
        ) : (
          <span key={k}>{p.t}</span>
        ),
      )}
    </p>
  );
}

export function ResultCard({ result, voiceAvailable }: { result: Analysis; voiceAvailable: boolean }) {
  const [lang, setLang] = useState<Lang>("en");
  const [voice, setVoice] = useState<{ state: "idle" | "loading" | "ready" | "error"; url?: string; msg?: string }>({
    state: "idle",
  });
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  const v = VERDICT[result.verdict];
  const exp = result.explanations[lang];
  const available = LANGS.filter((l) => result.explanations[l]);
  const spoken = exp ? [exp.summary, ...exp.actions].join(" ") : "";

  const shareText = exp
    ? `Ṣọ́ra check: ${v.label}\n\n${exp.summary}\n\nWhat to do:\n${exp.actions.map((a) => `• ${a}`).join("\n")}\n\n(Checked with Ṣọ́ra, a free prototype. It can be wrong. Always confirm with your bank.)`
    : "";

  async function makeVoice() {
    if (!voiceAvailable) {
      // Device voice fallback works for English and Pidgin only; YarnGPT2 is needed for the rest.
      if ((lang === "en" || lang === "pcm") && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(spoken);
        u.lang = "en-NG";
        u.rate = 0.92;
        u.onend = () => setPlaying(false);
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        setPlaying(true);
        return;
      }
      setVoice({ state: "error", msg: "Voice notes in this language need the YarnGPT2 voice service, which isn't connected on this deployment." });
      return;
    }
    setVoice({ state: "loading" });
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spoken.slice(0, 600), lang }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Voice failed");
      const url = URL.createObjectURL(await res.blob());
      setVoice({ state: "ready", url });
      requestAnimationFrame(() => audio.current?.play());
    } catch (e) {
      setVoice({ state: "error", msg: (e as Error).message });
    }
  }

  function switchLang(l: Lang) {
    setLang(l);
    setVoice({ state: "idle" });
    setPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="bezel"
      aria-live="polite"
    >
      <div className="bezel-core overflow-hidden">
        {/* Verdict */}
        <div className={clsx("relative flex items-center gap-5 px-6 py-6 sm:px-8", v.soft)}>
          <Seal verdict={result.verdict} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">Verdict</p>
            <h3 className={clsx("font-display text-3xl leading-tight tracking-tight sm:text-4xl", v.color)}>{v.label}</h3>
            <p className="mt-1 text-sm text-ink-soft">{v.sub}</p>
          </div>
        </div>

        <div className="space-y-8 px-6 py-7 sm:px-8">
          {/* Message with highlights */}
          <section>
            <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">The message</h4>
            <div className="rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5">
              <Highlighted text={result.text} flags={result.redFlags} />
            </div>
          </section>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <section>
              <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
                Red flags · {result.redFlags.length}
              </h4>
              <ol className="space-y-3">
                {result.redFlags.slice(0, 6).map((f, i) => (
                  <motion.li
                    key={`${f.quote}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.07 }}
                    className="flex gap-3"
                  >
                    <span
                      className={clsx(
                        "mt-2 h-2 w-2 shrink-0 rounded-full",
                        f.severity === "high" ? "bg-vermilion" : f.severity === "medium" ? "bg-ochre" : "bg-indigo",
                      )}
                    />
                    <div className="min-w-0 text-sm leading-relaxed">
                      <p className="font-medium text-ink">“{f.quote}”</p>
                      <p className="text-ink-soft">
                        {f.reason}{" "}
                        <span className="ml-1 rounded-full bg-ink/5 px-2 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wider text-muted">
                          {f.source === "rules" ? "rule" : "gemma"}
                        </span>
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </section>
          )}

          {/* Explanation in five languages */}
          <section>
            <div role="tablist" aria-label="Language" className="mb-4 flex flex-wrap gap-1.5">
              {available.map((l) => (
                <button
                  key={l}
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => switchLang(l)}
                  className={clsx(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-500 ease-[var(--ease-fluid)]",
                    lang === l ? "bg-ink text-paper" : "bg-ink/5 text-ink-soft hover:bg-ink/10",
                  )}
                >
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {exp && (
                <motion.div
                  key={lang}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  lang={lang === "pcm" ? "pcm" : lang}
                >
                  <p className="font-display text-xl leading-snug text-ink">{exp.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {exp.actions.map((a, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                        <span className="font-mono text-xs text-muted">0{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Actions */}
          <section className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (playing) {
                  audio.current?.pause();
                  if ("speechSynthesis" in window) speechSynthesis.cancel();
                  setPlaying(false);
                } else if (voice.state === "ready") audio.current?.play();
                else makeVoice();
              }}
              disabled={voice.state === "loading"}
              className="group inline-flex items-center gap-2.5 rounded-full bg-ink py-2 pl-2 pr-5 text-sm font-medium text-paper transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-indigo active:scale-[0.98] disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/12">
                {voice.state === "loading" ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/30 border-t-paper" />
                ) : playing ? (
                  <Pause weight="fill" size={14} />
                ) : voice.state === "ready" ? (
                  <Play weight="fill" size={14} />
                ) : (
                  <SpeakerHigh weight="light" size={16} />
                )}
              </span>
              {voice.state === "loading" ? "Recording voice note…" : `Voice note · ${LANG_NAMES[lang]}`}
            </button>
            {voice.state === "ready" && voice.url && (
              <a
                href={voice.url}
                download={`sora-${lang}.wav`}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink ring-1 ring-ink/10 transition hover:bg-ink/10"
                aria-label="Download voice note"
              >
                <DownloadSimple weight="light" size={18} />
              </a>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-3 text-sm text-ink ring-1 ring-ink/10 transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-[#25D366]/15 active:scale-[0.98]"
            >
              <WhatsappLogo weight="light" size={18} /> Send to family
            </a>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-3 text-sm text-ink ring-1 ring-ink/10 transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-ink/10 active:scale-[0.98]"
            >
              <Copy weight="light" size={18} /> {copied ? "Copied" : "Copy"}
            </button>
            <audio
              ref={audio}
              src={voice.url}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              hidden
            />
          </section>
          {voice.state === "error" && <p className="text-xs text-vermilion">{voice.msg}</p>}

          <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/5 pt-4 font-mono text-[10.5px] uppercase tracking-wider text-muted">
            <span>{result.engine.model ? `Gemma 4 · ${result.engine.model}` : "Rules engine only"}</span>
            <span>{(result.engine.latencyMs / 1000).toFixed(1)} s</span>
            {result.engine.droppedFlags > 0 && <span>{result.engine.droppedFlags} unquotable claim(s) dropped</span>}
            {result.engine.fallbackReason && <span title={result.engine.fallbackReason}>Model unavailable: used rules</span>}
            <span>Not stored</span>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}

/** Rotating seal: the "stamp" that marks the verdict. */
function Seal({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <div className={clsx("relative h-20 w-20 shrink-0", v.color)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow" aria-hidden>
        <defs>
          <path id="seal-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-mono text-[9.5px] uppercase tracking-[0.32em]">
          <textPath href="#seal-circle">Ṣọ́ra · be careful · Ṣọ́ra · be careful ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-current/10 ring-1 ring-current/30">
        <v.Icon weight="light" size={26} />
      </div>
    </div>
  );
}
