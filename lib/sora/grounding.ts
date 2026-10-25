import type { Span } from "./types";

/**
 * Grounding check: a model red flag is only kept if its quote really appears
 * in the message. This stops the model from inventing evidence.
 */

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokens = (s: string): string[] => fold(s).match(/[\p{L}\p{N}]+/gu) ?? [];

/** Find the quote in the text, tolerating case, accents, whitespace and punctuation differences. */
export function locateQuote(text: string, quote: string): Span | null {
  const q = quote.trim().replace(/^["'“”‘’]+|["'“”‘’.…]+$/g, "");
  if (q.length < 3) return null;

  // 1. Exact (case-insensitive, flexible whitespace).
  const flexible = new RegExp(q.split(/\s+/).map(escape).join("\\s+"), "i");
  const exact = flexible.exec(text);
  if (exact) return { start: exact.index, end: exact.index + exact[0].length };

  // 2. Accent-folded match on a string of the same length, so offsets map back to the original.
  // NFD can change length, so fold each character on its own (combining marks fold to "").
  const foldedChars = [...text].map(fold);
  const folded = foldedChars.join("");
  const offsets: number[] = [];
  let pos = 0;
  for (const c of [...text]) {
    offsets.push(pos);
    pos += c.length;
  }
  offsets.push(pos);
  const foldedOffsets: number[] = [];
  foldedChars.forEach((c, i) => {
    for (let k = 0; k < c.length; k++) foldedOffsets.push(i);
  });
  foldedOffsets.push(foldedChars.length);

  const qt = tokens(q);
  if (qt.length === 0) return null;
  const tokenRe = new RegExp(qt.map(escape).join("[^\\p{L}\\p{N}]+"), "iu");
  const m = tokenRe.exec(folded);
  if (m) {
    return { start: offsets[foldedOffsets[m.index]], end: offsets[foldedOffsets[m.index + m[0].length]] };
  }
  return null;
}

/**
 * Fuzzy grounding for OCR noise: at least 80% of the quote's words appear in
 * order in the text. Returns true/false; there is no reliable span to highlight.
 */
export function fuzzyGrounded(text: string, quote: string): boolean {
  const qt = tokens(quote);
  if (qt.length < 2) return false;
  const tt = tokens(text);
  let i = 0;
  let hits = 0;
  for (const w of qt) {
    const j = tt.indexOf(w, i);
    if (j !== -1) {
      hits++;
      i = j + 1;
    }
  }
  return hits / qt.length >= 0.8;
}
