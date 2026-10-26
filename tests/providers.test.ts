import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProvider } from "@/lib/sora/providers";

const ok = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "hello" }] } }] }), { status: 200 });
const fail = (status: number) => new Response("error", { status });
const req = { system: "s", user: "u", maxTokens: 100, timeoutMs: 5000 };

/** Whether each fetch call asked for thinkingConfig, in order. */
const thinkingCalls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string).generationConfig.thinkingConfig !== undefined);

describe("Gemini provider retries", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retries a transient 500 and returns the text", async () => {
    fetchMock.mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok());
    await expect(getProvider("gemini")!.complete(req)).resolves.toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(thinkingCalls(fetchMock)).toEqual([true, true]);
  });

  it("drops thinkingConfig after a 400 and does not put it back on a later 500 retry", async () => {
    fetchMock.mockResolvedValueOnce(fail(400)).mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok());
    await expect(getProvider("gemini")!.complete(req)).resolves.toBe("hello");
    expect(thinkingCalls(fetchMock)).toEqual([true, false, false]);
  });

  it("gives up after two retries and reports the status", async () => {
    fetchMock.mockResolvedValue(fail(503));
    await expect(getProvider("gemini")!.complete(req)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
