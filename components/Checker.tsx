"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ImageSquare, TextAlignLeft, X } from "@phosphor-icons/react";
import clsx from "clsx";
import type { Analysis } from "@/lib/sora/types";
import { SAMPLES } from "@/lib/samples";
import { EASE } from "./ui";
import { ResultCard } from "./ResultCard";

interface Health {
  backend: "gemini" | "openai" | "rules";
  model: string | null;
  voice: boolean;
}

/** Shrink screenshots in the browser: faster upload, and stays under the 4.5 MB function body limit. */
async function downscale(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function Checker() {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const modelLive = health?.backend && health.backend !== "rules";

  async function check() {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "image" && image ? { image, text: text || undefined } : { text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: window.innerWidth < 1024 ? "start" : "nearest" }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("That isn't an image.");
    setError(null);
    setImage(await downscale(f));
  }

  const canSubmit = !loading && (mode === "text" ? text.trim().length > 3 : !!image);

  return (
    <div className="space-y-5">
      <div className="bezel">
        <div className="bezel-core p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div role="tablist" className="flex gap-1 rounded-full bg-ink/5 p-1">
              {(
                [
                  ["text", "Paste text", TextAlignLeft],
                  ["image", "Screenshot", ImageSquare],
                ] as const
              ).map(([m, label, Icon]) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={clsx(
                    "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-500",
                    mode === m ? "text-paper" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  )}
                  <Icon weight="light" size={14} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
            <span
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted"
              title={health?.model ?? undefined}
            >
              <span className="relative flex h-2 w-2">
                {modelLive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-50" />}
                <span className={clsx("relative inline-flex h-2 w-2 rounded-full", modelLive ? "bg-forest" : "bg-ochre")} />
              </span>
              {health ? (modelLive ? "Gemma 4 live" : "Rules mode") : "…"}
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "text" ? (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <label htmlFor="msg" className="sr-only">
                  Message to check
                </label>
                <textarea
                  id="msg"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) check();
                  }}
                  placeholder="Paste the SMS or WhatsApp message here…"
                  rows={6}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl bg-paper/60 p-4 text-[15px] leading-relaxed text-ink ring-1 ring-ink/8 transition-shadow duration-500 placeholder:text-muted/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo/40"
                />
              </motion.div>
            ) : (
              <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                {image ? (
                  <div className="relative overflow-hidden rounded-2xl bg-paper/60 ring-1 ring-ink/8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Screenshot to check" className="max-h-64 w-full object-contain" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-paper"
                      aria-label="Remove screenshot"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      onFile(e.dataTransfer.files?.[0]);
                    }}
                    className="flex h-[158px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-paper/60 text-sm text-ink-soft transition hover:border-indigo/40 hover:bg-white"
                  >
                    <ImageSquare weight="light" size={28} />
                    Drop a screenshot or tap to choose
                    <span className="text-xs text-muted">Gemma 4 reads the text for you</span>
                  </button>
                )}
                {!modelLive && health && (
                  <p className="mt-2 text-xs text-ochre">Reading screenshots needs the model, which isn&apos;t connected right now. Paste the text instead.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-col-reverse gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-[10px] uppercase tracking-[0.2em] text-muted">Try one</span>
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setMode("text");
                    setText(s.text);
                    setResult(null);
                  }}
                  className="rounded-full bg-ink/[0.04] px-3 py-1 text-xs text-ink-soft ring-1 ring-ink/8 transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-ink hover:text-paper"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={check}
              disabled={!canSubmit}
              className="group inline-flex shrink-0 items-center justify-between gap-3 self-end rounded-full bg-ink py-2 pl-6 pr-2 text-sm font-medium text-paper transition-all duration-500 ease-[var(--ease-fluid)] hover:bg-indigo active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? "Checking…" : "Check message"}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/12 transition-transform duration-500 ease-[var(--ease-fluid)] group-hover:translate-x-1 group-hover:scale-105">
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border border-paper/30 border-t-paper" />
                ) : (
                  <ArrowRight weight="light" size={16} />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-vermilion-soft px-4 py-3 text-sm text-vermilion">
          {error}
        </motion.p>
      )}

      <div ref={resultRef} className="scroll-mt-28">
        {loading && <ResultSkeleton />}
        {result && <ResultCard key={result.text + result.engine.latencyMs} result={result} voiceAvailable={!!health?.voice} />}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="bezel">
      <div className="bezel-core space-y-4 p-7">
        {[0.5, 0.9, 0.75, 0.6].map((w, i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-ink/8"
            style={{ width: `${w * 100}%` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          />
        ))}
        <p className="pt-2 font-mono text-[10px] uppercase tracking-wider text-muted">Reading the message · checking rules · asking Gemma</p>
      </div>
    </div>
  );
}
