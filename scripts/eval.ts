/**
 * Evaluate Ṣọ́ra on data/eval.jsonl.
 *
 *   npm run eval                          # rules only (no key needed)
 *   npm run eval -- --backend gemini      # Gemma 4 via the Gemini API
 *   npm run eval -- --backend openai      # local Gemma 4 E4B via Ollama
 *   npm run eval -- --backend gemini --langs en,yo --limit 20
 *
 * Writes eval/results/<run>.json and updates eval/results/summary.json,
 * which the README table and the website read.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { analyze } from "../lib/sora/analyze";
import type { Backend, Lang, Verdict } from "../lib/sora/types";

interface Item {
  id: string;
  label: "scam" | "legit";
  scam_type: string | null;
  lang: Lang;
  text: string;
}

interface Row {
  id: string;
  label: Item["label"];
  lang: Lang;
  verdict: Verdict | "error";
  rulesVerdict?: Verdict;
  modelFlags: number;
  droppedFlags: number;
  fallback?: string;
  latencyMs: number;
}

function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const pct = (n: number, d: number) => (d === 0 ? null : Math.round((1000 * n) / d) / 10);
const quantile = (xs: number[], q: number) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

async function main() {
  loadEnv();
  const backend = (arg("backend", "rules") as Backend) ?? "rules";
  const langs = (arg("langs", "en") ?? "en").split(",") as Lang[];
  const limit = Number(arg("limit", "0"));
  const concurrency = Number(arg("concurrency", backend === "rules" ? "16" : "2"));
  const dataPath = arg("data", "data/eval.jsonl")!;

  let items: Item[] = readFileSync(dataPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  if (limit > 0) items = items.slice(0, limit);

  const rows: Row[] = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const it = items[i];
      const t0 = Date.now();
      for (let attempt = 0; ; attempt++) {
        try {
          const a = await analyze({ text: it.text }, { backend, languages: langs });
          if (a.engine.fallbackReason?.includes("429") && attempt < 4) throw new Error("rate limited");
          rows[i] = {
            id: it.id,
            label: it.label,
            lang: it.lang,
            verdict: a.verdict,
            rulesVerdict: a.engine.rulesVerdict,
            modelFlags: a.redFlags.filter((f) => f.source === "model").length,
            droppedFlags: a.engine.droppedFlags,
            ...(a.engine.fallbackReason && { fallback: a.engine.fallbackReason }),
            latencyMs: a.engine.latencyMs,
          };
          break;
        } catch (e) {
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 5_000 * (attempt + 1)));
            continue;
          }
          rows[i] = { id: it.id, label: it.label, lang: it.lang, verdict: "error", modelFlags: 0, droppedFlags: 0, fallback: (e as Error).message, latencyMs: Date.now() - t0 };
          break;
        }
      }
      done++;
      if (backend !== "rules") process.stdout.write(`\r${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (backend !== "rules") process.stdout.write("\n");

  const flagged = (r: Row) => r.verdict === "suspicious" || r.verdict === "likely_scam";
  const scams = rows.filter((r) => r.label === "scam");
  const legit = rows.filter((r) => r.label === "legit");
  const tp = scams.filter(flagged).length;
  const fp = legit.filter(flagged).length;
  const correct = tp + (legit.length - fp);
  const modelFlagsTotal = rows.reduce((s, r) => s + r.modelFlags + r.droppedFlags, 0);
  const modelFlagsKept = rows.reduce((s, r) => s + r.modelFlags, 0);
  const fallbacks = rows.filter((r) => r.fallback).length;

  const byLang: Record<string, { n: number; scamRecall: number | null; falseAlarmRate: number | null }> = {};
  for (const l of [...new Set(rows.map((r) => r.lang))]) {
    const s = scams.filter((r) => r.lang === l);
    const g = legit.filter((r) => r.lang === l);
    byLang[l] = {
      n: s.length + g.length,
      scamRecall: pct(s.filter(flagged).length, s.length),
      falseAlarmRate: pct(g.filter(flagged).length, g.length),
    };
  }

  const model =
    backend === "gemini"
      ? (process.env.GEMINI_MODEL ?? "gemma-4-26b-a4b-it")
      : backend === "openai"
        ? (process.env.OPENAI_MODEL ?? "gemma4:e4b")
        : null;
  const run = model ? `${backend}:${model}` : "rules";

  const summary = {
    run,
    backend,
    model,
    date: new Date().toISOString().slice(0, 10),
    dataset: { path: dataPath, n: rows.length, scam: scams.length, legit: legit.length },
    accuracy: pct(correct, rows.length),
    scamRecall: pct(tp, scams.length),
    strictScamRecall: pct(scams.filter((r) => r.verdict === "likely_scam").length, scams.length),
    falseAlarmRate: pct(fp, legit.length),
    precision: pct(tp, tp + fp),
    groundingRate: modelFlagsTotal ? pct(modelFlagsKept, modelFlagsTotal) : null,
    fallbacks,
    errors: rows.filter((r) => r.verdict === "error").length,
    latencyMs: { p50: quantile(rows.map((r) => r.latencyMs), 0.5), p95: quantile(rows.map((r) => r.latencyMs), 0.95) },
    byLang,
  };

  const outDir = "eval/results";
  mkdirSync(outDir, { recursive: true });
  const safe = run.replace(/[^a-z0-9.-]+/gi, "_");
  writeFileSync(path.join(outDir, `${safe}.json`), JSON.stringify({ summary, rows }, null, 2) + "\n");
  const summaryPath = path.join(outDir, "summary.json");
  const all = existsSync(summaryPath) ? JSON.parse(readFileSync(summaryPath, "utf8")) : {};
  all[run] = summary;
  writeFileSync(summaryPath, JSON.stringify(all, null, 2) + "\n");

  const misses = rows.filter((r) => r.label === "scam" && !flagged(r)).map((r) => r.id);
  const alarms = rows.filter((r) => r.label === "legit" && flagged(r)).map((r) => r.id);
  console.log(`\n${run} on ${rows.length} messages (${scams.length} scam / ${legit.length} legit)\n`);
  console.log("| Metric | Value |\n|---|---|");
  console.log(`| Accuracy | ${summary.accuracy}% |`);
  console.log(`| Scam recall (suspicious or likely scam) | ${summary.scamRecall}% |`);
  console.log(`| Strict scam recall (likely scam) | ${summary.strictScamRecall}% |`);
  console.log(`| False-alarm rate on legit messages | ${summary.falseAlarmRate}% |`);
  console.log(`| Precision | ${summary.precision}% |`);
  if (summary.groundingRate !== null) console.log(`| Grounding rate (model quotes found in input) | ${summary.groundingRate}% |`);
  console.log(`| Latency p50 / p95 | ${summary.latencyMs.p50} / ${summary.latencyMs.p95} ms |`);
  if (fallbacks) console.log(`| Model failures that fell back to rules | ${fallbacks} |`);
  console.log(`\nMissed scams: ${misses.join(", ") || "none"}`);
  console.log(`False alarms: ${alarms.join(", ") || "none"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
