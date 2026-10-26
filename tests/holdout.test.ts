import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Item {
  id: string;
  label: "scam" | "legit";
  lang: string;
  source: string;
  text: string;
}

const load = (path: string) =>
  readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Item);

// Keeps the held-out set honest: it must stay separate from the eval set. This does not check the rules' scores.
describe("held-out set (data/holdout.jsonl)", () => {
  const holdout = load("data/holdout.jsonl");
  const evalSet = load("data/eval.jsonl");

  it("has 50 messages, 30 scam and 20 legitimate, with unique h-prefixed ids", () => {
    expect(holdout).toHaveLength(50);
    expect(holdout.filter((i) => i.label === "scam")).toHaveLength(30);
    expect(holdout.filter((i) => i.label === "legit")).toHaveLength(20);
    expect(new Set(holdout.map((i) => i.id)).size).toBe(50);
    expect(holdout.every((i) => /^h\d{3}$/.test(i.id))).toBe(true);
  });

  it("shares no message with the eval set", () => {
    const seen = new Set(evalSet.map((i) => i.text.trim().toLowerCase()));
    expect(holdout.filter((i) => seen.has(i.text.trim().toLowerCase())).map((i) => i.id)).toEqual([]);
  });

  it("is labelled as synthetic and only uses fake-looking numbers", () => {
    expect(holdout.every((i) => i.source === "synthetic-holdout-ai-assisted")).toBe(true);
    // Real Nigerian mobile numbers are 11 digits starting 070/080/081/090/091; the sets use 0800000xxxx placeholders.
    const real = holdout.flatMap((i) => i.text.match(/\b0[789][01]\d{8}\b/g) ?? []).filter((n) => !n.startsWith("08000000"));
    expect(real).toEqual([]);
  });
});
