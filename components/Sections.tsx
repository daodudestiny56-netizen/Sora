import {
  Broadcast,
  Cpu,
  Eye,
  GitBranch,
  LockKey,
  Quotes,
  ShieldCheck,
  SpeakerHigh,
  Translate,
} from "@phosphor-icons/react/dist/ssr";
import summaryJson from "@/eval/results/summary.json";
import { Checker } from "./Checker";
import { FeaturePhone } from "./FeaturePhone";
import { REPO_URL } from "./Nav";
import { PillButton, Reveal } from "./ui";

/* ------------------------------------------------------------------ hero */

export function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-8 md:pt-40">
      <div id="check" className="grid scroll-mt-28 grid-cols-1 gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-vermilion" /> Open-weight AI · OPEN//BUILD 2026
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-7 font-display text-[clamp(3rem,7.4vw,6.4rem)] font-[350] leading-[0.92] tracking-[-0.035em] text-ink [font-variation-settings:'SOFT'_50,'WONK'_0]">
              Before you send money,{" "}
              <em className="font-[400] italic text-indigo [font-variation-settings:'SOFT'_100,'WONK'_1]">ṣọ́ra.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              Paste a suspicious SMS, WhatsApp message or screenshot. Ṣọ́ra points at the exact words that give the scam
              away, then tells your parents what to do in{" "}
              <span className="text-ink">English, Pidgin, Yorùbá, Hausa or Igbo</span>, with a voice note they can play. No
              smartphone? It works by <span className="text-ink">SMS and USSD</span> too.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/10 pt-6">
              {[
                ["5", "languages"],
                ["2G", "button phones via USSD & SMS"],
                ["0", "messages stored"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-4xl tracking-tight text-ink">{n}</dt>
                  <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <p className="mt-8 font-display text-sm italic text-muted">
            <span className="not-italic">Ṣọ́ra</span> (Yorùbá): “be careful.”
          </p>
        </div>
        <Reveal delay={0.12}>
          <Checker />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- marquee */

const PHRASES = [
  "Your BVN has been blocked",
  "I sent it to you by mistake",
  "This is my new number",
  "Pay ₦3,500 registration fee",
  "FirstBank-Alertz",
  "Verify within 24 hours",
  "Don't tell daddy",
  "You have won ₦2,000,000",
  "Send the code we sent you",
  "FG empowerment grant",
];

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-ink/8 bg-paper-2/60 py-5" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl italic text-ink/35">
        {[...PHRASES, ...PHRASES].map((p, i) => (
          <span key={i} className="flex items-center gap-10">
            “{p}”<span className="h-1.5 w-1.5 rounded-full bg-vermilion/50" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- how it works */

const STEPS = [
  ["Read", "Gemma 4 transcribes screenshots, sender ID and links included."],
  ["Rules", "Fixed checks for PIN/OTP/BVN requests, fees, fake links, lookalike senders."],
  ["Reason", "Gemma 4 weighs context and quotes the exact words that worry it."],
  ["Ground", "Any quote that isn't really in the message is thrown away."],
  ["Explain", "A calm verdict, 1–3 steps, five languages, a voice note."],
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-28 sm:px-8 md:py-40">
      <Reveal>
        <span className="eyebrow">How it works</span>
        <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,5vw,4.2rem)] font-[350] leading-[1] tracking-[-0.03em]">
          Evidence, not vibes. Every red flag points at real words.
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-12">
        <Reveal className="md:col-span-7 md:row-span-2">
          <div className="bezel h-full">
            <div className="bezel-core flex h-full flex-col p-7 sm:p-9">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">The pipeline</p>
              <ol className="mt-8 flex-1 space-y-0">
                {STEPS.map(([t, d], i) => (
                  <li key={t} className="group grid grid-cols-[3rem_1fr] gap-4 border-t border-ink/8 py-5 first:border-t-0">
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                    <div>
                      <p className="font-display text-2xl tracking-tight text-ink">{t}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-2xl bg-paper/70 p-4 font-mono text-[12.5px] leading-7 text-ink-soft ring-1 ring-ink/5">
                Dear customer, <mark className="hl-high rounded-[3px] px-0.5 text-ink">send your BVN and OTP</mark> to{" "}
                <mark className="hl-medium rounded-[3px] px-0.5 text-ink">bit.ly/unblock-acct</mark>{" "}
                <mark className="hl-low rounded-[3px] px-0.5 text-ink">immediately</mark>.
              </div>
            </div>
          </div>
        </Reveal>

        <Feature
          className="md:col-span-5"
          icon={<ShieldCheck weight="light" size={22} />}
          title="Rules set the floor"
          body="A PIN, OTP or fee request can never be marked “no red flags”, whatever the model says. The model can raise a verdict, but it can't wave a scam through."
          delay={0.08}
        />
        <Feature
          className="md:col-span-5"
          icon={<Quotes weight="light" size={22} />}
          title="No invented evidence"
          body="Gemma must copy each suspicious phrase word for word. If the quote isn't in the message, it's dropped and counted. We report that rate."
          delay={0.14}
        />
        <Reveal className="md:col-span-4" delay={0.06}>
          <div className="bezel-dark h-full bg-ink">
            <div className="bezel-dark-core flex h-full flex-col justify-between gap-10 p-7 text-paper">
              <Translate weight="light" size={24} className="text-paper/70" />
              <div>
                <p className="font-display text-2xl tracking-tight">Five languages. Real voices.</p>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">
                  English, Pidgin, Yorùbá, Hausa and Igbo, with full tone marks. Voice notes come from YarnGPT2, an open
                  Nigerian-accent TTS model.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
        <Feature
          className="md:col-span-4"
          icon={<LockKey weight="light" size={22} />}
          title="Nothing is stored"
          body="Messages are processed in memory and forgotten. No accounts, no logs of what you paste."
          delay={0.1}
        />
        <Feature
          className="md:col-span-4"
          icon={<Eye weight="light" size={22} />}
          title="Never says “safe”"
          body="The calmest verdict is “no red flags found, still confirm with your bank”. Ṣọ́ra is a second opinion, not a guarantee."
          delay={0.14}
        />
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
  className,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal className={className} delay={delay}>
      <div className="bezel h-full">
        <div className="bezel-core flex h-full flex-col justify-between gap-10 p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-ink ring-1 ring-ink/8">{icon}</span>
          <div>
            <p className="font-display text-2xl tracking-tight text-ink">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------------------------------------------------- button phones */

export function Phones() {
  return (
    <section id="phones" className="adire relative scroll-mt-16 overflow-hidden text-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:py-40 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <span className="eyebrow !bg-paper/10 !text-paper/70 !shadow-[inset_0_0_0_1px_rgb(244_238_227/0.15)]">
              <Broadcast weight="light" size={12} /> For button phones
            </span>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.4rem)] font-[350] leading-[1] tracking-[-0.03em]">
              No smartphone? <em className="italic text-[#e9b97a]">Dial it.</em>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
              The people scammers target most often use phones with buttons, not apps. Ṣọ́ra meets them there, on the same
              engine, in their own language.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              ["USSD menu", "Dial the code, pick a language, type the key words. The verdict comes back in one screen."],
              ["Forward the SMS", "Forward the strange text to Ṣọ́ra. Start with YO, HA, IG or PCM to get the reply in that language."],
              ["Fits a 2G screen", "Replies drop tone marks for GSM-7 and stay within two SMS, so they show on any handset and cost the same."],
              ["Falls back safely", "USSD sessions time out after about 20 s. If the model is slow, the rules answer instead of leaving a blank screen."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={0.06 * i}>
                <div className="border-t border-paper/15 pt-5">
                  <p className="font-display text-xl tracking-tight">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-paper/60">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.1}>
          <FeaturePhone />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ evaluation */

interface RunSummary {
  run: string;
  backend: string;
  model: string | null;
  date: string;
  dataset: { n: number; scam: number; legit: number };
  accuracy: number;
  scamRecall: number;
  strictScamRecall: number;
  falseAlarmRate: number;
  precision: number;
  groundingRate: number | null;
  latencyMs: { p50: number; p95: number };
  fallbacks: number;
}

export function Evaluation() {
  const runs = Object.values(summaryJson as unknown as Record<string, RunSummary>);
  const modelRuns = runs.filter((r) => r.model);
  const lead = modelRuns[0] ?? runs[0];
  const label = (r: RunSummary) => (r.model ? `Gemma 4 · ${r.model} + rules` : "Rules only (no model)");

  return (
    <section id="eval" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-28 sm:px-8 md:py-40">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <Reveal>
          <span className="eyebrow">Evaluation</span>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-[350] leading-[1] tracking-[-0.03em]">
            Measured, not promised.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
            {lead.dataset.n} messages: {lead.dataset.scam} scams and {lead.dataset.legit} real alerts, OTPs and family texts.
            Missing a scam is the worst failure, but crying wolf on a real bank alert teaches people to ignore warnings, so
            we track both.
          </p>
          <pre className="mt-8 overflow-x-auto rounded-2xl bg-ink p-5 font-mono text-[12.5px] leading-6 text-paper/85">
            <span className="text-paper/40"># reproduce in one command</span>
            {"\n"}npm run eval -- --backend gemini
          </pre>
        </Reveal>

        <div className="space-y-5">
          <Reveal>
            <div className="bezel">
              <div className="bezel-core p-7 sm:p-9">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{label(lead)}</p>
                <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3">
                  <Stat value={lead.scamRecall} label="of scams caught" />
                  <Stat value={lead.falseAlarmRate} label="false alarms on real messages" tone="forest" />
                  <Stat value={lead.accuracy} label="overall accuracy" />
                </div>
                {lead.groundingRate !== null && (
                  <p className="mt-6 text-sm text-ink-soft">
                    {lead.groundingRate}% of the model’s quoted evidence was found word for word in the message.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="overflow-x-auto rounded-3xl ring-1 ring-ink/8">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-paper-2/70 text-[10px] uppercase tracking-[0.18em] text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Engine</th>
                    <th className="px-3 py-3 font-medium">Scam recall</th>
                    <th className="px-3 py-3 font-medium">False alarms</th>
                    <th className="px-3 py-3 font-medium">Accuracy</th>
                    <th className="px-3 py-3 font-medium">p50</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.run} className="border-t border-ink/6">
                      <td className="px-5 py-3.5 text-ink">{label(r)}</td>
                      <td className="px-3 py-3.5 font-mono">{r.scamRecall}%</td>
                      <td className="px-3 py-3.5 font-mono">{r.falseAlarmRate}%</td>
                      <td className="px-3 py-3.5 font-mono">{r.accuracy}%</td>
                      <td className="px-3 py-3.5 font-mono">{r.latencyMs.p50 < 1000 ? `${r.latencyMs.p50} ms` : `${(r.latencyMs.p50 / 1000).toFixed(1)} s`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-xs leading-relaxed text-muted">
              The dataset is small and synthetic: written from public scam warnings, with no real personal data. Rules were
              revised once after error analysis on this set, so rules-only numbers are optimistic. Full method and
              limitations are in the repository.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, tone }: { value: number | null; label: string; tone?: "forest" }) {
  return (
    <div>
      <p className={`font-display text-5xl tracking-tight ${tone === "forest" ? "text-forest" : "text-ink"}`}>
        {value ?? "—"}
        <span className="text-2xl text-muted">%</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-muted">{label}</p>
    </div>
  );
}

/* ----------------------------------------------------------- open source */

const MODELS = [
  {
    name: "Gemma 4",
    role: "Reads screenshots, judges context, quotes evidence, writes five languages",
    licence: "Apache 2.0",
    note: "26B A4B hosted via the Gemini API for the live demo; E4B runs on a laptop with Ollama.",
  },
  {
    name: "YarnGPT2",
    role: "Nigerian-accent voice notes in Yorùbá, Hausa, Igbo and English",
    licence: "Apache 2.0",
    note: "Self-hosted voice service (services/voice) built on Hugging Face transformers.",
  },
];

export function OpenSource() {
  return (
    <section id="open" className="scroll-mt-16 bg-paper-2/60">
      <div className="mx-auto max-w-7xl px-4 py-28 sm:px-8 md:py-40">
        <Reveal>
          <span className="eyebrow">Open by design</span>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,5vw,4.2rem)] font-[350] leading-[1] tracking-[-0.03em]">
            Open weights, open licence, open data.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {MODELS.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.08}>
              <div className="bezel h-full">
                <div className="bezel-core h-full p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 ring-1 ring-ink/8">
                      {i === 0 ? <Cpu weight="light" size={22} /> : <SpeakerHigh weight="light" size={22} />}
                    </span>
                    <span className="rounded-full bg-forest-soft px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-forest">
                      {m.licence}
                    </span>
                  </div>
                  <p className="mt-8 font-display text-3xl tracking-tight">{m.name}</p>
                  <p className="mt-2 text-ink-soft">{m.role}</p>
                  <p className="mt-4 text-sm text-muted">{m.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
            <pre className="overflow-x-auto rounded-[2rem] bg-ink p-7 font-mono text-[13px] leading-7 text-paper/85">
              <span className="text-paper/40"># run it yourself</span>
              {"\n"}git clone {REPO_URL}.git
              {"\n"}cd Sora && npm install
              {"\n"}cp .env.example .env <span className="text-paper/40"># add a free Gemini key, or use Ollama</span>
              {"\n"}npm run dev
            </pre>
            <div className="flex flex-col justify-between gap-6 rounded-[2rem] p-7 ring-1 ring-ink/8">
              <p className="leading-relaxed text-ink-soft">
                Code is Apache 2.0. The eval set is CC BY 4.0. We chose Gemma 4 over N-ATLaS because N-ATLaS’s licence caps
                use at 1,000 monthly users and it can’t read images. The reasoning is written up in the README.
              </p>
              <PillButton className="self-start" href={REPO_URL} icon={<GitBranch weight="light" size={16} />}>
                Read the code
              </PillButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-8">
        <p className="font-display text-[clamp(4rem,16vw,13rem)] font-[300] leading-[0.8] tracking-[-0.05em] text-paper/90">
          Ṣọ́ra<span className="text-vermilion">.</span>
        </p>
        <div className="mt-14 grid gap-8 border-t border-paper/10 pt-8 text-sm text-paper/55 md:grid-cols-3">
          <p>A prototype for OPEN//BUILD 2026 (OSCA Ile-Ife Hacktoberfest). It can be wrong. Always confirm with your bank.</p>
          <p>Not affiliated with any bank, the CBN, EFCC, NCC or any telco. Messages are processed in memory and never stored.</p>
          <p className="md:text-right">
            <a href={REPO_URL} className="underline decoration-paper/25 underline-offset-4 hover:text-paper">
              Source on GitHub
            </a>{" "}
            · Apache 2.0
          </p>
        </div>
      </div>
    </footer>
  );
}
