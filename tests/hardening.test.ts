import { describe, expect, it, vi } from "vitest";
import { analyzeLocally } from "@/lib/sora/local";
import { handleUssd, parseSmsLanguage, shortVerdict } from "@/lib/sora/channels";
import { failureCode } from "@/lib/sora/analyze";
import { isIncomplete } from "@/lib/sora/templates";
import { fetchMedia, formatReply } from "@/lib/sora/whatsapp";

describe("final hardening", () => {
  it("never says 'no red flags' when the model did not take part", () => {
    const a = analyzeLocally("Hello, NNPC is recruiting graduates. Kindly come with your documents.");
    expect(a.verdict).toBe("no_red_flags");
    expect(isIncomplete(a)).toBe(true);
    expect(shortVerdict(a, "en", 182)).toMatch(/could not finish the full check/i);
    expect(formatReply(a, "yo")).toMatch(/^🟠 \*Ṣọ́ra: A kò lè yẹ̀ ẹ́ wò tán\*/);
  });

  it("keeps the normal verdict when the model answered", () => {
    const a = { ...analyzeLocally("Your OTP is 482913. Do not share it."), engine: { ...analyzeLocally("x").engine, fallbackReason: undefined } };
    expect(isIncomplete(a)).toBe(false);
  });

  it("only fetches WhatsApp media from Twilio over HTTPS", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const creds = { sid: "AC1", token: "t", from: "whatsapp:+1" };
    expect(await fetchMedia(creds, "http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(await fetchMedia(creds, "https://evil.example/x.png")).toBeNull();
    expect(await fetchMedia(creds, "not a url")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not read casual words as a language prefix", () => {
    expect(parseSmsLanguage("Yo bro, send me 20k now").lang).toBe("en");
    expect(parseSmsLanguage("YO bro, send me 20k now").lang).toBe("yo");
    expect(parseSmsLanguage("yoruba: send me 20k").lang).toBe("yo");
  });

  it("reports model failures as short codes, never the provider's error text", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(failureCode(new Error("Gemini API 429: quota exceeded for project 1234567"))).toBe("rate_limited");
    expect(failureCode(new Error("The operation was aborted due to timeout"))).toBe("timeout");
    expect(failureCode(new Error("Gemini API 500: internal"))).toBe("model_error");
    err.mockRestore();
  });

  it("USSD still answers a typed scam without the model", async () => {
    expect(await handleUssd("1*1*send your BVN and OTP", "3XXXX")).toMatch(/^END This message is very likely a scam/);
  });
});
