"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Phone, PhoneDisconnect } from "@phosphor-icons/react";
import clsx from "clsx";
import { EASE } from "./ui";

const DEMO_CODE = "*384*7672#";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const SMS_SAMPLE = "YO Congratulations! You have been selected for FG empowerment grant of N250,000. Pay registration fee of N3,500 to claim.";

type Screen =
  | { kind: "idle" }
  | { kind: "menu"; body: string; final: boolean }
  | { kind: "loading" }
  | { kind: "sms-compose" }
  | { kind: "sms-reply"; body: string };

/**
 * A button-phone simulator wired to the real /api/channels endpoints, so the
 * USSD and SMS flows on the site are the same code a telco callback would hit.
 */
export function FeaturePhone() {
  const [tab, setTab] = useState<"ussd" | "sms">("ussd");
  const [screen, setScreen] = useState<Screen>({ kind: "idle" });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [sms, setSms] = useState(SMS_SAMPLE);

  async function ussd(nextHistory: string[]) {
    setScreen({ kind: "loading" });
    try {
      const res = await fetch("/api/channels/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nextHistory.join("*") }),
      });
      const body = await res.text();
      setHistory(nextHistory);
      setInput("");
      setScreen({ kind: "menu", body: body.slice(4), final: body.startsWith("END") });
    } catch {
      setScreen({ kind: "menu", body: "Connection problem or invalid MMI code.", final: true });
    }
  }

  async function sendSms() {
    setScreen({ kind: "loading" });
    try {
      const res = await fetch("/api/channels/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sms }),
      });
      const json = (await res.json()) as { reply?: string };
      setScreen({ kind: "sms-reply", body: json.reply ?? "No reply." });
    } catch {
      setScreen({ kind: "sms-reply", body: "Message failed." });
    }
  }

  function reset(t = tab) {
    setScreen(t === "sms" ? { kind: "sms-compose" } : { kind: "idle" });
    setInput("");
    setHistory([]);
  }

  function call() {
    if (tab === "sms") {
      if (screen.kind === "sms-compose") sendSms();
      else reset();
      return;
    }
    if (screen.kind === "idle") {
      if (input.replace(/\s/g, "") === DEMO_CODE || input === "") ussd([]);
      else setScreen({ kind: "menu", body: `Dial ${DEMO_CODE} to reach Sora.`, final: true });
    } else if (screen.kind === "menu" && !screen.final) {
      if (input.trim()) ussd([...history, input.trim()]);
    } else reset();
  }

  function press(k: string) {
    if (tab === "sms" || (screen.kind === "menu" && screen.final)) return;
    setInput((s) => (s + k).slice(0, 160));
  }

  // After "<language>*1" the menu asks for free text instead of a menu number.
  const awaitingMessage = screen.kind === "menu" && !screen.final && history.length === 2 && history[1] === "1";

  function onKey(e: React.KeyboardEvent) {
    if (awaitingMessage || tab === "sms") return;
    if (/^[0-9*#]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") setInput((s) => s.slice(0, -1));
    else if (e.key === "Enter") call();
    else if (e.key === "Escape") reset();
    else return;
    e.preventDefault();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div role="tablist" className="flex gap-1 rounded-full bg-paper/10 p-1 ring-1 ring-paper/10">
        {(["ussd", "sms"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              reset(t);
            }}
            className={clsx(
              "relative rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors duration-500",
              tab === t ? "text-ink" : "text-paper/60 hover:text-paper",
            )}
          >
            {tab === t && <motion.span layoutId="phone-tab" className="absolute inset-0 rounded-full bg-paper" transition={{ duration: 0.5, ease: EASE }} />}
            <span className="relative">{t === "ussd" ? `USSD ${DEMO_CODE}` : "SMS forward"}</span>
          </button>
        ))}
      </div>

      {/* The handset */}
      <div
        tabIndex={0}
        onKeyDown={onKey}
        aria-label="Button phone simulator. Type digits, Enter to send, Escape to end."
        className="relative w-[272px] rounded-[2.6rem] bg-gradient-to-b from-[#2a2f45] to-[#151a2c] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-black/40">
        <div className="mx-auto mb-2 mt-1 h-1.5 w-14 rounded-full bg-black/40" />
        <div className="rounded-[1.4rem] bg-black/40 p-2">
          <div className="relative h-[228px] overflow-hidden rounded-xl bg-[#b9c4a0] p-3 font-mono text-[12px] leading-[1.35] text-[#1f2a17] shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)]">
            <div className="mb-1.5 flex justify-between text-[9px] opacity-70">
              <span>▂▄▆ MTN NG</span>
              <span>{tab === "ussd" ? "USSD" : "Messages"}</span>
              <span>▮▮▮▯</span>
            </div>
            <div className="h-[184px] overflow-y-auto whitespace-pre-wrap break-words pr-1">
              {screen.kind === "idle" && (
                <div className="flex h-full flex-col justify-between">
                  <p className="opacity-80">Sora demo line{"\n"}Dial {DEMO_CODE}{"\n"}then press the green key.</p>
                  <p className="text-right text-lg tracking-wider">{input || <span className="opacity-40">{DEMO_CODE}</span>}</p>
                </div>
              )}
              {screen.kind === "loading" && <p className="animate-pulse">{tab === "ussd" ? "USSD code running…" : "Sending…"}</p>}
              {screen.kind === "menu" && (
                <>
                  <p>{screen.body}</p>
                  {!screen.final && (
                    <div className="mt-2 border-t border-[#1f2a17]/30 pt-1">
                      {awaitingMessage ? (
                        <textarea
                          autoFocus
                          value={input}
                          onChange={(e) => setInput(e.target.value.slice(0, 160))}
                          rows={2}
                          placeholder="type here…"
                          className="w-full resize-none bg-transparent placeholder:text-[#1f2a17]/40 focus:outline-none"
                        />
                      ) : (
                        <p>&gt; {input}<span className="animate-pulse">_</span></p>
                      )}
                    </div>
                  )}
                  {screen.final && <p className="mt-2 opacity-60">[ OK ]</p>}
                </>
              )}
              {screen.kind === "sms-compose" && (
                <>
                  <p className="opacity-70">To: Sora</p>
                  <textarea
                    value={sms}
                    onChange={(e) => setSms(e.target.value.slice(0, 480))}
                    rows={7}
                    className="mt-1 w-full resize-none bg-transparent focus:outline-none"
                  />
                </>
              )}
              {screen.kind === "sms-reply" && (
                <>
                  <p className="opacity-70">From: Sora</p>
                  <p className="mt-1">{screen.body}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Soft keys */}
        <div className="mt-3 grid grid-cols-3 items-center gap-2 px-1">
          <button
            onClick={call}
            aria-label={tab === "sms" ? "Send" : "Call / OK"}
            className="flex h-10 items-center justify-center rounded-2xl bg-[#2f7a50] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition active:scale-95"
          >
            <Phone weight="fill" size={16} />
          </button>
          <button
            onClick={() => setInput((s) => s.slice(0, -1))}
            className="h-10 rounded-2xl bg-white/8 text-[10px] uppercase tracking-widest text-paper/70 transition active:scale-95"
          >
            Clear
          </button>
          <button
            onClick={() => reset()}
            aria-label="End"
            className="flex h-10 items-center justify-center rounded-2xl bg-[#a8331b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition active:scale-95"
          >
            <PhoneDisconnect weight="fill" size={16} />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 px-1 pb-2">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="h-9 rounded-xl bg-gradient-to-b from-white/12 to-white/5 font-mono text-sm text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition active:scale-95 active:bg-white/20"
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <p className="max-w-[300px] text-center text-xs leading-relaxed text-paper/50">
        Live simulator using the same endpoints a telco would call. {DEMO_CODE} is a demo code; a real shortcode needs
        provisioning through Africa&apos;s Talking.
      </p>
    </div>
  );
}
