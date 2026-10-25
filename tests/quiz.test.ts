import { describe, expect, it } from "vitest";
import { POOL, ROUNDS, newGame, UI } from "@/lib/quiz";
import { runRules } from "@/lib/sora/rules";
import { LANGS } from "@/lib/sora/types";

describe("Spot the scam game", () => {
  it("deals 8 rounds with 5 scams and 3 real messages, no repeats", () => {
    for (let k = 0; k < 20; k++) {
      const g = newGame();
      expect(g).toHaveLength(ROUNDS);
      expect(g.filter((r) => r.scam)).toHaveLength(5);
      expect(new Set(g.map((r) => r.text)).size).toBe(ROUNDS);
    }
  });

  it("never teaches that a message is real when the checker would flag it", () => {
    for (const r of POOL.filter((x) => !x.scam)) expect(runRules(r.text).verdict, r.text).toBe("no_red_flags");
  });

  it("has every string in all five languages", () => {
    for (const l of LANGS) for (const v of Object.values(UI[l])) expect(typeof v === "function" || (typeof v === "string" && v.length > 0)).toBe(true);
  });
});
