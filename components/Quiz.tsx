"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowCounterClockwise, CheckCircle, WhatsappLogo, XCircle } from "@phosphor-icons/react";
import clsx from "clsx";
import { newGame, ROUNDS, UI, type Round } from "@/lib/quiz";
import { runRules } from "@/lib/sora/rules";
import { WHY, topCategories } from "@/lib/sora/templates";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/sora/types";
import { EASE } from "./ui";

type Phase = { kind: "start" } | { kind: "play"; game: Round[]; i: number; picked: boolean | null; score: number } | { kind: "end"; score: number };

function Bubble({ round, reveal }: { round: Round; reveal: boolean }) {
  const parts = useMemo(() => {
    if (!reveal || !round.scam) return [{ t: round.text }];
    const flags = runRules(round.text).flags.filter((f) => f.span).sort((a, b) => a.span!.start - b.span!.start);
    const out: { t: string; sev?: string }[] = [];
    let i = 0;
    for (const f of flags) {
      if (f.span!.end <= i) continue;
      const s = Math.max(f.span!.start, i);
      if (s > i) out.push({ t: round.text.slice(i, s) });
      out.push({ t: round.text.slice(s, f.span!.end), sev: f.severity });
      i = f.span!.end;
    }
    if (i < round.text.length) out.push({ t: round.text.slice(i) });
    return out;
  }, [round, reveal]);

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-2 text-center text-[11px] text-muted">{round.sender} · Text message</p>
      <div className="rounded-[1.4rem] rounded-bl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-[0_1px_2px_rgba(20,26,46,0.06)] ring-1 ring-ink/5">
        {parts.map((p, k) =>
          p.sev ? (
            <mark key={k} className={clsx("rounded-[3px] px-0.5 text-ink", `hl-${p.sev}`)}>
              {p.t}
            </mark>
          ) : (
            <span key={k}>{p.t}</span>
          ),
        )}
      </div>
    </div>
  );
}

export function Quiz() {
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>({ kind: "start" });
  const t = UI[lang];

  function answer(saysScam: boolean) {
    if (phase.kind !== "play" || phase.picked !== null) return;
    const correct = saysScam === phase.game[phase.i].scam;
    setPhase({ ...phase, picked: saysScam, score: phase.score + (correct ? 1 : 0) });
  }

  function next() {
    if (phase.kind !== "play") return;
    if (phase.i + 1 >= phase.game.length) setPhase({ kind: "end", score: phase.score });
    else setPhase({ ...phase, i: phase.i + 1, picked: null });
  }

  const start = () => setPhase({ kind: "play", game: newGame(), i: 0, picked: null, score: 0 });

  const lesson = (round: Round) => {
    if (!round.scam) return t.realLesson;
    const cats = topCategories(runRules(round.text).flags, 2).filter((c): c is keyof (typeof WHY)["en"] => c !== "model_judgement");
    return cats.length ? cats.map((c) => WHY[lang][c]).join(" ") : t.hiddenScam;
  };

  return (
    <div className="bezel">
      <div className="bezel-core overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/6 px-5 py-4 sm:px-7">
          <div role="tablist" aria-label="Language" className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all duration-500 ease-[var(--ease-fluid)]",
                  lang === l ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/5",
                )}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
          {phase.kind === "play" && (
            <div className="flex items-center gap-1.5" aria-label={`Message ${phase.i + 1} of ${ROUNDS}`}>
              {phase.game.map((_, k) => (
                <span
                  key={k}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-500 ease-[var(--ease-fluid)]",
                    k === phase.i ? "w-6 bg-ink" : k < phase.i ? "w-1.5 bg-ink/40" : "w-1.5 bg-ink/10",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-h-[380px] px-5 py-8 sm:px-10 sm:py-10" lang={lang === "pcm" ? "pcm" : lang}>
          <AnimatePresence mode="wait">
            {phase.kind === "start" && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex min-h-[300px] flex-col items-center justify-center text-center"
              >
                <p className="font-display text-5xl font-[620] tracking-[-0.04em] sm:text-6xl">{t.title}</p>
                <p className="mt-4 max-w-sm text-ink-soft">{t.intro}</p>
                <button
                  onClick={start}
                  className="group mt-8 inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-6 pr-2 text-sm font-medium text-paper transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-indigo active:scale-[0.98]"
                >
                  {t.start}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/12 transition-transform duration-500 ease-[var(--ease-fluid)] group-hover:translate-x-1">
                    <ArrowRight weight="light" size={16} />
                  </span>
                </button>
              </motion.div>
            )}

            {phase.kind === "play" && (
              <motion.div
                key={`round-${phase.i}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <Bubble round={phase.game[phase.i]} reveal={phase.picked !== null} />

                {phase.picked === null ? (
                  <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
                    <button
                      onClick={() => answer(true)}
                      className="rounded-2xl bg-vermilion py-4 text-base font-semibold text-white transition-all duration-500 ease-[var(--ease-fluid)] hover:brightness-110 active:scale-[0.97]"
                    >
                      {t.scam}
                    </button>
                    <button
                      onClick={() => answer(false)}
                      className="rounded-2xl bg-forest py-4 text-base font-semibold text-white transition-all duration-500 ease-[var(--ease-fluid)] hover:brightness-110 active:scale-[0.97]"
                    >
                      {t.real}
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="mx-auto mt-6 max-w-md"
                    aria-live="polite"
                  >
                    {(() => {
                      const round = phase.game[phase.i];
                      const ok = phase.picked === round.scam;
                      return (
                        <>
                          <p className={clsx("flex items-center gap-2 font-display text-2xl font-[600] tracking-tight", ok ? "text-forest" : "text-vermilion")}>
                            {ok ? <CheckCircle weight="light" size={26} /> : <XCircle weight="light" size={26} />}
                            {ok ? t.right : t.wrong} <span className="text-ink">{round.scam ? t.wasScam : t.wasReal}</span>
                          </p>
                          <p className="mt-2 leading-relaxed text-ink-soft">{lesson(round)}</p>
                          <button
                            onClick={next}
                            className="group mt-6 inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-sm font-medium text-paper transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-indigo active:scale-[0.98]"
                          >
                            {phase.i + 1 >= phase.game.length ? t.finish : t.next}
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/12 transition-transform duration-500 group-hover:translate-x-1">
                              <ArrowRight weight="light" size={14} />
                            </span>
                          </button>
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase.kind === "end" && (
              <motion.div
                key="end"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex min-h-[300px] flex-col items-center justify-center text-center"
              >
                <p className="font-display text-7xl font-[650] tracking-[-0.05em] sm:text-8xl">{t.score(phase.score, ROUNDS)}</p>
                <p className="mt-4 max-w-sm text-lg text-ink-soft">{t.verdict(phase.score, ROUNDS)}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `I scored ${phase.score}/${ROUNDS} on Ṣọ́ra's "Scam or real?" game. Can you beat me? Learn the signs before a scammer tests you: ${typeof window !== "undefined" ? window.location.origin : ""}/#practice`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-indigo active:scale-[0.98]"
                  >
                    <WhatsappLogo weight="light" size={18} /> {t.share}
                  </a>
                  <button
                    onClick={start}
                    className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-5 py-3 text-sm text-ink ring-1 ring-ink/10 transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-ink/10 active:scale-[0.98]"
                  >
                    <ArrowCounterClockwise weight="light" size={18} /> {t.again}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
