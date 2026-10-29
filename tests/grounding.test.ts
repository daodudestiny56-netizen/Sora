import { describe, expect, it } from "vitest";
import { fuzzyGrounded, locateQuote } from "@/lib/sora/grounding";
import { groundFlags, mergeVerdict } from "@/lib/sora/analyze";
import { runRules } from "@/lib/sora/rules";

const text = "Dear customer, your BVN  has been SUSPENDED. Click bit.ly/x9 to re-validate.";

describe("grounding", () => {
  it("finds exact quotes with different case and spacing", () => {
    const s = locateQuote(text, "your bvn has been suspended")!;
    expect(text.slice(s.start, s.end)).toBe("your BVN  has been SUSPENDED");
  });

  it("finds quotes that differ only in tone marks", () => {
    const yo = "Ẹ jọ̀ọ́, ẹ fi nọ́mbà OTP ránṣẹ́ sí wa";
    const s = locateQuote(yo, "e fi nomba OTP ranse")!;
    expect(yo.slice(s.start, s.end)).toBe("ẹ fi nọ́mbà OTP ránṣẹ́");
  });

  it("rejects invented quotes", () => {
    expect(locateQuote(text, "send us your password")).toBeNull();
    expect(fuzzyGrounded(text, "send us your password")).toBe(false);
  });

  it("tolerates OCR noise", () => {
    expect(fuzzyGrounded("Your acc0unt will be blocked today", "your account will be blocked today")).toBe(true);
  });

  it("drops ungrounded model flags and counts them", () => {
    const { kept, dropped } = groundFlags(text, {
      verdict: "likely_scam",
      scam_type: "bvn_phishing",
      explanations: {},
      red_flags: [
        { quote: "BVN has been SUSPENDED", category: "urgency_threat", reason: "threat", severity: "medium" },
        { quote: "enter your card PIN", category: "credential_request", reason: "made up", severity: "high" },
      ],
    });
    expect(kept).toHaveLength(1);
    expect(dropped).toBe(1);
  });
});

describe("merge", () => {
  it("never lets the model clear a high-severity rule hit", () => {
    const r = runRules("Kindly send your OTP to confirm the reversal.");
    expect(mergeVerdict(r.verdict, r.flags, "no_red_flags")).toBe("suspicious");
  });

  it("lets the model raise a verdict the rules missed", () => {
    expect(mergeVerdict("no_red_flags", [], "likely_scam")).toBe("likely_scam");
  });

  it("lets the model clear weak rule hits", () => {
    const r = runRules("Reply urgently please");
    expect(mergeVerdict(r.verdict, r.flags, "no_red_flags")).toBe("no_red_flags");
  });
});

describe("merge cannot be turned green (audit regression)", () => {
  it("keeps a medium-flag rules 'likely scam' out of the green when the model says no red flags", () => {
    const r = runRules("Your GTB account will be blocked within 24 hours. Verify at gtbank-verify.com");
    expect(r.verdict).toBe("likely_scam");
    expect(mergeVerdict(r.verdict, r.flags, "no_red_flags", r.score)).not.toBe("no_red_flags");
  });

  it("keeps any rules warning at least suspicious", () => {
    const r = runRules("Your account will be suspended. Call our agent now.");
    expect(r.verdict).not.toBe("no_red_flags");
    expect(mergeVerdict(r.verdict, r.flags, "no_red_flags", r.score)).not.toBe("no_red_flags");
  });
});
