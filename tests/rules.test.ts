import { describe, expect, it } from "vitest";
import { runRules } from "@/lib/sora/rules";

const cats = (t: string) => runRules(t).flags.map((f) => f.category);

describe("rules engine", () => {
  it("flags a BVN phishing text as likely scam", () => {
    const r = runRules(
      "FirstBank-Alertz: Your account has been blocked due to BVN update. Verify your BVN within 24 hours at http://firstbank-verify.com.ng to avoid permanent restriction.",
    );
    expect(r.verdict).toBe("likely_scam");
    expect(r.flags.map((f) => f.category)).toEqual(
      expect.arrayContaining(["lookalike_sender", "urgency_threat", "credential_request", "suspicious_link"]),
    );
  });

  it("does not flag a real OTP message that says do not share", () => {
    const r = runRules("Your OTP for transfer of NGN5,000.00 is 482913. Do not share this OTP with anyone. Expires in 5 mins.");
    expect(r.flags.filter((f) => f.category === "credential_request")).toHaveLength(0);
    expect(r.verdict).toBe("no_red_flags");
  });

  it("does not flag a normal debit alert", () => {
    const r = runRules("Acct:******4821 DR:NGN2,500.00 Desc:POS PURCHASE SHOPRITE IKEJA Avail Bal:NGN48,210.55 Date:12-10-2026 14:02");
    expect(r.flags).toHaveLength(0);
    expect(r.verdict).toBe("no_red_flags");
  });

  it("catches the mistaken-transfer refund trick", () => {
    const r = runRules("Good evening ma, I mistakenly sent 20,000 to your account. Please kindly refund the money to my Opay 8031234567, God bless you.");
    expect(r.verdict).toBe("likely_scam");
    expect(r.flags.some((f) => f.category === "fake_credit_alert")).toBe(true);
  });

  it("catches the new-number scam", () => {
    const r = runRules("Hi mummy this is my new number, my phone got stolen. I need 15k urgently please don't tell daddy");
    expect(r.flags.map((f) => f.category)).toEqual(expect.arrayContaining(["new_number", "secrecy_pressure"]));
    expect(r.verdict).toBe("likely_scam");
  });

  it("catches fee-before-grant", () => {
    const r = runRules("Congratulations! You have been selected for the FG empowerment grant of N250,000. Pay a registration fee of N3,500 to claim.");
    expect(r.verdict).toBe("likely_scam");
    expect(r.flags.some((f) => f.category === "advance_fee")).toBe(true);
  });

  it("returns spans that point at the quoted text", () => {
    const text = "Please send your ATM PIN to our agent now.";
    for (const f of runRules(text).flags) expect(text.slice(f.span!.start, f.span!.end).trim()).toBe(f.quote);
  });

  it("does not treat official domains as suspicious", () => {
    expect(cats("Visit https://www.cbn.gov.ng/consumer for help").includes("suspicious_link")).toBe(false);
  });

  it("matches the Yorùbá new-number phrase", () => {
    expect(cats("Ẹ káàsán màámi, nọ́mbà tuntun mi nìyí")).toContain("new_number");
  });
});
