import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { analyzeLocally } from "@/lib/sora/local";
import { formatReply, isGreeting, signVoice, twiml, validTwilioSignature, verifyVoice } from "@/lib/sora/whatsapp";

describe("WhatsApp channel", () => {
  it("validates Twilio signatures and rejects tampering", () => {
    const url = "https://sora.example/api/channels/whatsapp";
    const params = { From: "whatsapp:+2348000000001", Body: "YO send your BVN", NumMedia: "0" };
    const data = url + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join("");
    const sig = createHmac("sha1", "secret-token").update(data).digest("base64");
    expect(validTwilioSignature("secret-token", url, params, sig)).toBe(true);
    expect(validTwilioSignature("secret-token", url, { ...params, Body: "changed" }, sig)).toBe(false);
    expect(validTwilioSignature("wrong-token", url, params, sig)).toBe(false);
  });

  it("formats a reply with tone marks, actions and quoted evidence", () => {
    const a = analyzeLocally("Kindly send your BVN and OTP to unblock your account at bit.ly/x");
    const reply = formatReply(a, "yo");
    expect(reply).toMatch(/^🔴 \*Ṣọ́ra: Ó ṣeé ṣe kó jẹ́ jìbìtì\*/);
    expect(reply).toContain("Ohun tí ẹ máa ṣe");
    expect(reply).toContain("“");
    expect(reply.length).toBeLessThan(1600);
  });

  it("recognises greetings so first contact gets instructions", () => {
    expect(isGreeting("Hello")).toBe(true);
    expect(isGreeting("bawo")).toBe(true);
    expect(isGreeting("Hello sir I sent money by mistake")).toBe(false);
  });

  it("escapes XML in TwiML", () => {
    expect(twiml("a < b & c")).toContain("<Message>a &lt; b &amp; c</Message>");
  });

  it("signs voice links that expire and can't be altered", () => {
    const q = new URLSearchParams(signVoice("Ẹ ṣọ́ra o", "yo", "k"));
    expect(verifyVoice(q, "k")).toEqual({ text: "Ẹ ṣọ́ra o", lang: "yo" });
    q.set("t", "something else");
    expect(verifyVoice(q, "k")).toBeNull();
    expect(verifyVoice(new URLSearchParams(signVoice("x", "en", "k", -10)), "k")).toBeNull();
  });
});
