import { readFileSync } from "node:fs";
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

// Each new rule gets a message that must be flagged and a legitimate look-alike that must not be.
// None of these messages are in data/eval.jsonl, so they check the patterns, not the eval set.
describe("rules for fake fines, job and delivery fees, code read-outs and family emergencies", () => {
  const flagged = (text: string, category: string) => cats(text).includes(category as never);

  it("flags a fine demanded to avoid arrest, but not a normal traffic fine notice", () => {
    const scam = "EFCC: A case is open against your NIN. Pay N40,000 fine to avoid arrest.";
    expect(flagged(scam, "advance_fee")).toBe(true);
    expect(runRules(scam).verdict).toBe("likely_scam");
    expect(runRules("You can pay your LASTMA fine on the official portal within 30 days.").verdict).toBe("no_red_flags");
  });

  it("flags job, training and delivery fees, but not a receipt for one", () => {
    expect(flagged("Dangote Group is hiring cleaners. Training fee of N7,500 must be paid to start.", "advance_fee")).toBe(true);
    expect(flagged("Your parcel is held. Pay N3,000 redelivery fee to our agent 08000000009.", "advance_fee")).toBe(true);
    expect(runRules("Your application fee of N5,000 has been received. Receipt no 12345.").verdict).toBe("no_red_flags");
    expect(runRules("There is no registration form fee for this event.").flags).toHaveLength(0);
  });

  it("flags a courier who wants fuel money first", () => {
    expect(flagged("Good afternoon, I'm your dispatch rider. I need N1,500 for fuel before I can deliver.", "advance_fee")).toBe(true);
    expect(runRules("Your rider is 5 minutes away. Please have your order number ready.").verdict).toBe("no_red_flags");
  });

  it("flags a request to read out or send back a code, but not 'do not share' warnings", () => {
    expect(flagged("Hello from your telecom. Please read out the code you just received so we can restore your line.", "credential_request")).toBe(true);
    expect(runRules("Do not share the code we sent you with anyone. It expires in 5 minutes.").flags).toHaveLength(0);
  });

  it("flags 'lost my phone' plus a money request, but not a plain family update", () => {
    const scam = "Auntie it's Tunde, I lost my phone. Please send 25k to this account number 0123456789, I'll explain later.";
    expect(flagged(scam, "new_number")).toBe(true);
    expect(runRules(scam).verdict).not.toBe("no_red_flags");
    expect(runRules("Hi Mum, I lost my phone yesterday and I'm using Chidi's until Friday. Will buy a new one.").verdict).toBe("no_red_flags");
  });

  it("flags a relative in danger plus a demand for money, but not a hospital visit", () => {
    const scam = "Sir, your son has been kidnapped. Send N500,000 now or he will be hurt.";
    expect(flagged(scam, "urgency_threat")).toBe(true);
    expect(runRules("Dad is in hospital for a checkup, he's fine. Call him when you can.").verdict).toBe("no_red_flags");
  });

  it("flags 'don't call' pressure and 'send 50k urgently'", () => {
    expect(flagged("Pls don't call the bank, just send 30k urgently, I go explain later.", "secrecy_pressure")).toBe(true);
    expect(flagged("Pls don't call the bank, just send 30k urgently, I go explain later.", "urgency_threat")).toBe(true);
  });

  it("flags quick-money platform pitches and 'free monthly' offers", () => {
    expect(flagged("We just made 90k from this platform this week. Use my code to join and deposit, they pay every Monday.", "too_good_to_be_true")).toBe(true);
    expect(flagged("Get N20,000 free monthly from the government. Register now.", "too_good_to_be_true")).toBe(true);
  });

  it("treats a lookalike delivery link as suspicious but the real DHL site as fine", () => {
    expect(flagged("Confirm your address at dhl-ng-redelivery.site", "suspicious_link")).toBe(true);
    expect(flagged("DHL: Your parcel has shipped. Track at https://www.dhl.com/ng-en/home/tracking.html", "suspicious_link")).toBe(false);
  });

  it("matches the Yorùbá mistaken-transfer request", () => {
    expect(flagged("Ẹ pẹ̀lẹ́, àṣìṣe ni mo fi ₦15,000 ránṣẹ́ sí yín. Ẹ dá a padà.", "fake_credit_alert")).toBe(true);
  });
});

describe("rules against data/eval.jsonl", () => {
  const items = readFileSync("data/eval.jsonl", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { id: string; label: "scam" | "legit"; text: string });

  it("keeps the only known false alarm (e147) and adds no new ones", () => {
    const falseAlarms = items.filter((i) => i.label === "legit" && runRules(i.text).verdict !== "no_red_flags").map((i) => i.id);
    expect(falseAlarms).toEqual(["e147"]);
  });

  it("catches at least 95% of the scams (suspicious or likely scam)", () => {
    const scams = items.filter((i) => i.label === "scam");
    const caught = scams.filter((i) => runRules(i.text).verdict !== "no_red_flags").length;
    expect(caught / scams.length).toBeGreaterThanOrEqual(0.95);
  });
});
