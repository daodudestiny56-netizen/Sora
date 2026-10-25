import { describe, expect, it } from "vitest";
import { handleSms, handleUssd, parseSmsLanguage, toGsm } from "@/lib/sora/channels";
import { analyze } from "@/lib/sora/analyze";

describe("feature-phone channels", () => {
  it("strips tone marks for GSM-7", () => {
    expect(toGsm("Ẹ ṣọ́ra o, ọ̀rọ̀ yìí")).toBe("E sora o, oro yii");
    expect(toGsm("saƙo ɗaya")).toBe("sako daya");
  });

  it("walks the USSD menu", async () => {
    expect(await handleUssd("", "3XXXX")).toMatch(/^CON .*1\. English/s);
    expect(await handleUssd("3", "3XXXX")).toMatch(/^CON 1\. Ye oro kan wo/);
    expect(await handleUssd("1*1", "3XXXX")).toMatch(/^CON Type the message/);
    const verdict = await handleUssd("1*1*send your BVN and OTP to unblock your account", "3XXXX");
    expect(verdict).toMatch(/^END This message is very likely a scam/);
    expect(verdict.length).toBeLessThanOrEqual(186);
    expect(await handleUssd("4*2*1", "3XXXX")).toMatch(/^END .*PIN/);
    expect(await handleUssd("2*3", "38000")).toContain("38000");
    expect(await handleUssd("9", "3XXXX")).toMatch(/^END Invalid/);
  });

  it("keeps * inside a typed message", async () => {
    expect(await handleUssd("1*1*dial *737*51# and send OTP", "3XXXX")).toMatch(/^END /);
  });

  it("reads the SMS language prefix", () => {
    expect(parseSmsLanguage("YO: Your BVN is blocked")).toEqual({ lang: "yo", message: "Your BVN is blocked" });
    expect(parseSmsLanguage("Your BVN is blocked").lang).toBe("en");
    expect(parseSmsLanguage("Hausa saƙo").lang).toBe("ha");
  });

  it("replies to SMS in at most two segments", async () => {
    const { reply, lang } = await handleSms("YO Congratulations you have won N500,000. Pay processing fee of N5,000 to claim");
    expect(lang).toBe("yo");
    expect(reply.length).toBeLessThanOrEqual(306);
    expect(reply).toMatch(/^Sora: O see se gan-an/);
  });

  it("analyses in rules-only mode with every language filled", async () => {
    const a = await analyze({ text: "This is my new number. Send 10k urgently, don't tell daddy" });
    expect(a.engine.backend).toBe("rules");
    expect(Object.keys(a.explanations).sort()).toEqual(["en", "ha", "ig", "pcm", "yo"]);
    expect(a.verdict).not.toBe("no_red_flags");
  });
});

describe("on-device OCR cleanup", () => {
  it("rejoins wrapped chat-bubble lines and split links", async () => {
    const { unwrap } = await import("@/lib/ocr");
    const raw = "FirstBank-Alertz\nText Message - Today 9:41 AM\nYour account has been blocked due to\nincomplete BVN update. Verify your\nBVN at http://firstbank-bvn-\nupdate.com within 24hrs";
    const t = unwrap(raw);
    expect(t).toContain("http://firstbank-bvn-update.com");
    expect(t).toContain("blocked due to incomplete BVN update");
    expect(t.startsWith("FirstBank-Alertz\n")).toBe(true);
    const { runRules } = await import("@/lib/sora/rules");
    expect(runRules(t).verdict).toBe("likely_scam");
  });
});

describe("offline check (PWA)", () => {
  it("runs rules and templates on the device with every language filled", async () => {
    const { analyzeLocally } = await import("@/lib/sora/local");
    const a = analyzeLocally("Dear customer, kindly send your BVN and OTP to unblock your account");
    expect(a.verdict).toBe("likely_scam");
    expect(a.engine.fallbackReason).toBe("offline");
    expect(Object.keys(a.explanations).sort()).toEqual(["en", "ha", "ig", "pcm", "yo"]);
  });
});
