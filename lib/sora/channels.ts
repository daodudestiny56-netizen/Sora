import { analyze } from "./analyze";
import { ACTION, HEADLINE, WHY, templateExplanation, topCategories } from "./templates";
import { LANGS, type Analysis, type Lang } from "./types";

/**
 * Feature-phone channels (USSD + SMS) for people without smartphones.
 * Built against the Africa's Talking callback format, which is the common
 * aggregator API for MTN, Airtel, Glo and 9mobile in Nigeria.
 */

const GSM_MAP: Record<string, string> = { ɓ: "b", Ɓ: "B", ɗ: "d", Ɗ: "D", ƙ: "k", Ƙ: "K", ƴ: "y", Ƴ: "Y", "’": "'", "‘": "'", "“": '"', "”": '"', "—": "-", "–": "-", "…": "..." };

/**
 * Many basic phones can't display tone marks, and a single non-GSM character
 * makes the network bill every SMS part at 70 characters instead of 160.
 * Strip marks for these channels; the web app keeps full orthography.
 */
export function toGsm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ɓƁɗƊƙƘƴƳ’‘“”—–…]/g, (c) => GSM_MAP[c])
    .replace(/ṅ/g, "n")
    .normalize("NFC");
}

const fit = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 3).trimEnd()}...`);

// USSD screens are limited to ~182 characters.
const USSD_MAX = 182;

const MENU: Record<Lang, { main: string; prompt: string; tipsTitle: string; how: string; invalid: string }> = {
  en: {
    main: "1. Check a message\n2. Common scams\n3. Check by SMS",
    prompt: "Type the message (or its key words):",
    tipsTitle: "Common scams:",
    how: "Forward any strange SMS to {n}. Start with EN, PCM, YO, HA or IG for your language. Free tips: dial again.",
    invalid: "Invalid choice. Dial again.",
  },
  pcm: {
    main: "1. Check message\n2. Common scam dem\n3. Check with SMS",
    prompt: "Type di message (or di main words):",
    tipsTitle: "Common scam dem:",
    how: "Forward any strange SMS to {n}. Start am with PCM make we reply for Pidgin.",
    invalid: "Wrong choice. Dial again.",
  },
  yo: {
    main: "1. Ye ọ̀rọ̀ kan wò\n2. Jìbìtì tó wọ́pọ̀\n3. Yẹ̀ ẹ́ wò pẹ̀lú SMS",
    prompt: "Tẹ ọ̀rọ̀ náà (tàbí àwọn ọ̀rọ̀ pàtàkì inú rẹ̀):",
    tipsTitle: "Jìbìtì tó wọ́pọ̀:",
    how: "Fi SMS àjèjì èyíkéyìí ránṣẹ́ sí {n}. Bẹ̀rẹ̀ rẹ̀ pẹ̀lú YO kí a lè dáhùn ní Yorùbá.",
    invalid: "Àṣàyàn tí kò tọ́. Ẹ tún tẹ̀ ẹ́.",
  },
  ha: {
    main: "1. Duba saƙo\n2. Damfara da aka saba\n3. Duba ta SMS",
    prompt: "Rubuta saƙon (ko muhimman kalmominsa):",
    tipsTitle: "Damfara da aka saba:",
    how: "Tura duk wani saƙo mai ban mamaki zuwa {n}. Fara da HA don amsa da Hausa.",
    invalid: "Zaɓi mara kyau. Sake bugawa.",
  },
  ig: {
    main: "1. Lelee ozi\n2. Aghụghọ a na-ahụkarị\n3. Lelee site na SMS",
    prompt: "Pịa ozi ahụ (ma ọ bụ isi okwu ya):",
    tipsTitle: "Aghụghọ a na-ahụkarị:",
    how: "Zigara ozi ọ bụla dị ịtụnanya na {n}. Bido ya na IG ka anyị zaa n'Igbo.",
    invalid: "Nhọrọ ezighi ezi. Pịa ọzọ.",
  },
};

const LANG_MENU = "Sora: Be careful\n1. English\n2. Pidgin\n3. Yoruba\n4. Hausa\n5. Igbo";

const TIP_TOPICS = ["credential_request", "fake_credit_alert", "new_number", "advance_fee", "suspicious_link"] as const;
const TIP_ACTION = { credential_request: "never_share", fake_credit_alert: "check_app", new_number: "call_old_number", advance_fee: "never_pay_fee", suspicious_link: "no_link" } as const;
const TIP_LABEL: Record<Lang, string[]> = {
  en: ["PIN/OTP/BVN requests", "Fake credit alerts", "\"My new number\"", "Grants with a fee", "Fake links"],
  pcm: ["Dem dey ask PIN/OTP/BVN", "Fake credit alert", "\"Na my new number\"", "Grant wey need fee", "Fake link"],
  yo: ["Bíbéèrè PIN/OTP/BVN", "Àlẹ́ẹ̀tì owó èké", "\"Nọ́mbà tuntun mi\"", "Ẹ̀bùn tó ń béèrè owó", "Ìtọ́ka èké"],
  ha: ["Neman PIN/OTP/BVN", "Sanarwar kuɗi ta ƙarya", "\"Sabuwar lambata\"", "Tallafi mai neman kuɗi", "Mahaɗi na ƙarya"],
  ig: ["Ịrịọ PIN/OTP/BVN", "Ozi ego adịgboroja", "\"Nọmba m ọhụrụ\"", "Onyinye na-arịọ ụgwọ", "Njikọ adịgboroja"],
};

export function shortVerdict(a: Analysis, lang: Lang, max: number): string {
  const cats = topCategories(a.redFlags, 1).filter((c) => c !== "model_judgement");
  const why = cats.length ? WHY[lang][cats[0] as keyof (typeof WHY)["en"]] : "";
  const action = (a.explanations[lang] ?? templateExplanation(lang, a.verdict, a.redFlags)).actions[0] ?? "";
  // Template headline keeps the reply consistent and short on 2G screens.
  return fit(toGsm([HEADLINE[lang][a.verdict], why, action].filter(Boolean).join(" ")), max);
}

/**
 * Africa's Talking USSD: `text` is every input so far joined by "*".
 * Reply starts with "CON " to keep the session open or "END " to close it.
 */
export async function handleUssd(text: string, smsNumber: string): Promise<string> {
  const parts = text === "" ? [] : text.split("*");
  const end = (s: string) => `END ${fit(toGsm(s), USSD_MAX)}`;
  const con = (s: string) => `CON ${fit(toGsm(s), USSD_MAX)}`;

  if (parts.length === 0) return `CON ${LANG_MENU}`;
  const lang = LANGS[Number(parts[0]) - 1];
  if (!lang) return end(MENU.en.invalid);
  const m = MENU[lang];
  if (parts.length === 1) return con(m.main);

  const choice = parts[1];
  if (choice === "1") {
    if (parts.length === 2) return con(m.prompt);
    // The message itself may contain "*", so re-join everything after the menu choices.
    const message = parts.slice(2).join("*").trim();
    if (!message) return con(m.prompt);
    // USSD sessions time out after ~20 s, so give the model a short budget and fall back to rules.
    const a = await analyze({ text: message }, { languages: [lang], timeoutMs: 8_000 });
    return `END ${shortVerdict(a, lang, USSD_MAX)}`;
  }
  if (choice === "2") {
    if (parts.length === 2) return con(`${m.tipsTitle}\n${TIP_LABEL[lang].map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
    const topic = TIP_TOPICS[Number(parts[2]) - 1];
    if (!topic) return end(m.invalid);
    return end(`${WHY[lang][topic]} ${ACTION[lang][TIP_ACTION[topic]]}`);
  }
  if (choice === "3") return end(m.how.replace("{n}", smsNumber));
  return end(m.invalid);
}

const PREFIX: Record<string, Lang> = { en: "en", eng: "en", english: "en", pcm: "pcm", pidgin: "pcm", yo: "yo", yor: "yo", yoruba: "yo", ha: "ha", hau: "ha", hausa: "ha", ig: "ig", ibo: "ig", igbo: "ig" };

/** "YO <forwarded message>" → Yorùbá reply. No prefix → English. */
export function parseSmsLanguage(body: string): { lang: Lang; message: string } {
  const m = body.trim().match(/^([a-z]{2,7})\b[\s:,-]*/i);
  const lang = m ? PREFIX[m[1].toLowerCase()] : undefined;
  return lang ? { lang, message: body.trim().slice(m![0].length) } : { lang: "en", message: body.trim() };
}

const HELP = "Sora: forward a strange SMS here to check it. Start with EN, PCM, YO, HA or IG for your language. Sora is a free prototype and can be wrong.";

/** Build the SMS reply: at most 2 GSM-7 segments (306 chars) to keep cost predictable. */
export async function handleSms(body: string): Promise<{ lang: Lang; reply: string }> {
  const { lang, message } = parseSmsLanguage(body);
  if (!message || /^help$/i.test(message)) return { lang, reply: HELP };
  const a = await analyze({ text: message }, { languages: [lang], timeoutMs: 25_000 });
  return { lang, reply: `Sora: ${shortVerdict(a, lang, 300)}` };
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  if (!username || !apiKey) return false;
  const host = username === "sandbox" ? "api.sandbox.africastalking.com" : "api.africastalking.com";
  const form = new URLSearchParams({ username, to, message });
  if (process.env.AT_SENDER_ID) form.set("from", process.env.AT_SENDER_ID);
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: "POST",
    headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok;
}
