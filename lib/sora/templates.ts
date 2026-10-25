import type { Explanation, FlagCategory, Lang, RedFlag, Verdict } from "./types";

/**
 * Hand-written explanations used when the model is unavailable (rules-only
 * mode) and for the SMS / USSD channels, where replies must be short and
 * predictable. Yorùbá, Hausa and Igbo strings are pending native-speaker
 * review — see docs/LANGUAGES.md.
 */

type Table<K extends string> = Record<Lang, Record<K, string>>;

export const HEADLINE: Table<Verdict> = {
  en: {
    likely_scam: "This message is very likely a scam.",
    suspicious: "Be careful. This message has warning signs.",
    no_red_flags: "No red flags found. Still confirm with your bank directly.",
  },
  pcm: {
    likely_scam: "E be like say dis message na scam.",
    suspicious: "Shine your eye. Dis message get some wahala signs.",
    no_red_flags: "We no see red flag. But still confirm with your bank by yourself.",
  },
  yo: {
    likely_scam: "Ó ṣeé ṣe gan-an kí ọ̀rọ̀ yìí jẹ́ jìbìtì.",
    suspicious: "Ẹ ṣọ́ra o. Ọ̀rọ̀ yìí ní àwọn àmì ewu.",
    no_red_flags: "A kò rí àmì ewu kankan. Síbẹ̀, ẹ jẹ́rìí sí i lọ́dọ̀ ilé-ìfowópamọ́ yín fúnra yín.",
  },
  ha: {
    likely_scam: "Wannan saƙon yana kama da damfara sosai.",
    suspicious: "Ku yi hankali. Wannan saƙon yana da alamun haɗari.",
    no_red_flags: "Ba mu ga alamar haɗari ba. Duk da haka, ku tabbatar da bankinku kai tsaye.",
  },
  ig: {
    likely_scam: "O yikarịrị ka ozi a bụ aghụghọ.",
    suspicious: "Kpachara anya. Ozi a nwere ihe ịdọ aka ná ntị.",
    no_red_flags: "Anyị ahụghị ihe ịdọ aka ná ntị. Ma jụọ ụlọ akụ gị ozugbo.",
  },
};

type Why = Exclude<FlagCategory, "model_judgement">;

export const WHY: Table<Why> = {
  en: {
    credential_request: "It asks for your PIN, OTP, BVN or password. Banks never ask for these.",
    suspicious_link: "The link does not go to an official bank or government website.",
    lookalike_sender: "The sender name copies a bank but is not the real one.",
    urgency_threat: "It threatens to block your account to rush you.",
    new_number: "\"This is my new number\" is how the family-emergency scam starts.",
    advance_fee: "It asks you to pay a fee before you receive money.",
    too_good_to_be_true: "It promises free money or a prize you never applied for.",
    fake_credit_alert: "It says money was sent by mistake and asks you to send it back.",
    secrecy_pressure: "It asks you to keep it secret or not to call.",
    authority_impersonation: "It pretends to be from the CBN, EFCC or another agency.",
    off_channel_contact: "It pushes you to call a private number, not your bank.",
  },
  pcm: {
    credential_request: "Dem dey ask for your PIN, OTP, BVN or password. Bank no dey ever ask for am.",
    suspicious_link: "Di link no be di bank or government real website.",
    lookalike_sender: "Di sender name dey copy bank name, but no be di real bank.",
    urgency_threat: "Dem dey threaten say dem go block your account make you rush.",
    new_number: "\"Na my new number be dis\" na how di family emergency scam dey start.",
    advance_fee: "Dem wan make you pay fee before you collect money.",
    too_good_to_be_true: "Dem dey promise free money or prize wey you no apply for.",
    fake_credit_alert: "Dem talk say dem send money by mistake, make you send am back.",
    secrecy_pressure: "Dem talk say make you no tell anybody or make you no call.",
    authority_impersonation: "Dem dey pretend say dem be CBN, EFCC or government agency.",
    off_channel_contact: "Dem dey push you make you call private number, no be your bank.",
  },
  yo: {
    credential_request: "Wọ́n ń béèrè PIN, OTP, BVN tàbí password yín. Ilé-ìfowópamọ́ kì í béèrè wọn láé.",
    suspicious_link: "Ìtọ́ka (link) náà kì í ṣe ojú òpó ilé-ìfowópamọ́ tàbí ti ìjọba.",
    lookalike_sender: "Orúkọ olùfiránṣẹ́ náà ń ṣe àfarawé ilé-ìfowópamọ́, ṣùgbọ́n kì í ṣe òótọ́.",
    urgency_threat: "Wọ́n ń dẹ́rù bà yín pé wọn yóò ti àkáǹtì yín pa kí ẹ lè kánjú.",
    new_number: "\"Nọ́mbà tuntun mi nìyí\" ni bí jìbìtì pàjáwìrì ẹbí ṣe máa ń bẹ̀rẹ̀.",
    advance_fee: "Wọ́n ní kí ẹ san owó kan kí ẹ tó gba owó.",
    too_good_to_be_true: "Wọ́n ń ṣèlérí owó ọ̀fẹ́ tàbí ẹ̀bùn tí ẹ kò béèrè fún.",
    fake_credit_alert: "Wọ́n ní àṣìṣe ni wọ́n fi fi owó ránṣẹ́, kí ẹ dá a padà.",
    secrecy_pressure: "Wọ́n ní kí ẹ má sọ fún ẹnikẹ́ni tàbí kí ẹ má pe ẹnikẹ́ni.",
    authority_impersonation: "Wọ́n ń díbọ́n pé àwọn ni CBN, EFCC tàbí àjọ ìjọba kan.",
    off_channel_contact: "Wọ́n ń tì yín láti pe nọ́mbà àdáni, kì í ṣe ilé-ìfowópamọ́ yín.",
  },
  ha: {
    credential_request: "Yana neman PIN, OTP, BVN ko kalmar sirrinku. Banki ba ya taɓa neman waɗannan.",
    suspicious_link: "Mahaɗin (link) ba na gidan yanar gizon banki ko gwamnati na gaskiya ba ne.",
    lookalike_sender: "Sunan mai aikawa yana kwaikwayon banki, amma ba na gaskiya ba ne.",
    urgency_threat: "Yana barazanar rufe asusunku don ku yi gaggawa.",
    new_number: "\"Wannan sabuwar lambata ce\" haka damfarar gaggawar iyali ke farawa.",
    advance_fee: "Yana neman ku biya kuɗi kafin ku karɓi kuɗi.",
    too_good_to_be_true: "Yana alƙawarin kuɗi kyauta ko kyautar da ba ku nema ba.",
    fake_credit_alert: "Ya ce an tura kuɗi bisa kuskure, ku mayar da su.",
    secrecy_pressure: "Yana cewa kada ku gaya wa kowa ko kada ku kira.",
    authority_impersonation: "Yana yin kamar shi CBN ne, EFCC ko wata hukuma.",
    off_channel_contact: "Yana tura ku ku kira lambar wani mutum, ba bankinku ba.",
  },
  ig: {
    credential_request: "Ọ na-arịọ PIN, OTP, BVN ma ọ bụ password gị. Ụlọ akụ anaghị arịọ ha.",
    suspicious_link: "Njikọ (link) a anaghị aga na weebụsaịtị ụlọ akụ ma ọ bụ gọọmentị n'ezie.",
    lookalike_sender: "Aha onye zitere ya na-eṅomi ụlọ akụ, mana ọ bụghị nke ezi.",
    urgency_threat: "Ọ na-eyi egwu imechi akaụntụ gị ka i mee ngwa ngwa.",
    new_number: "\"Nke a bụ nọmba m ọhụrụ\" bụ otú aghụghọ mberede ezinụlọ si amalite.",
    advance_fee: "Ọ na-arịọ gị ịkwụ ụgwọ tupu ị nata ego.",
    too_good_to_be_true: "Ọ na-ekwe nkwa ego n'efu ma ọ bụ onyinye ị na-arịọghị.",
    fake_credit_alert: "Ọ sị na e zitere ego na mmejọ, ka i weghachite ya.",
    secrecy_pressure: "Ọ sị ka ị ghara ịgwa onye ọ bụla ma ọ bụ ịkpọ oku.",
    authority_impersonation: "Ọ na-eme ka ya bụ CBN, EFCC ma ọ bụ ụlọ ọrụ gọọmentị.",
    off_channel_contact: "Ọ na-akpali gị ịkpọ nọmba onwe onye, ọ bụghị ụlọ akụ gị.",
  },
};

type ActionKey = "never_share" | "no_link" | "check_app" | "call_old_number" | "never_pay_fee" | "call_bank" | "pause";

export const ACTION: Table<ActionKey> = {
  en: {
    never_share: "Never share your PIN, OTP, BVN or password with anyone.",
    no_link: "Don't open the link. Use your bank app or the number on the back of your card.",
    check_app: "Check your balance in your bank app, not the SMS, before sending anything back.",
    call_old_number: "Call the person on their old number before you send any money.",
    never_pay_fee: "Don't pay any fee. Real grants and prizes never ask for one.",
    call_bank: "If unsure, call your bank with the number on your card or visit a branch.",
    pause: "Take your time. No real bank will punish you for checking first.",
  },
  pcm: {
    never_share: "No ever give anybody your PIN, OTP, BVN or password.",
    no_link: "No click di link. Use your bank app or di number wey dey back of your card.",
    check_app: "Check your balance for your bank app, no be di SMS, before you send anything back.",
    call_old_number: "Call di person for im old number before you send any money.",
    never_pay_fee: "No pay any fee. Real grant or prize no dey ask for fee.",
    call_bank: "If you no sure, call your bank with di number for your card or go branch.",
    pause: "Take your time. Real bank no go punish you because you check first.",
  },
  yo: {
    never_share: "Ẹ má ṣe fún ẹnikẹ́ni ní PIN, OTP, BVN tàbí password yín láé.",
    no_link: "Ẹ má ṣí ìtọ́ka náà. Ẹ lo áàpù ilé-ìfowópamọ́ yín tàbí nọ́mbà ẹ̀yìn káàdì yín.",
    check_app: "Ẹ yẹ owó inú àkáǹtì yín wò nínú áàpù ilé-ìfowópamọ́, kì í ṣe nínú SMS, kí ẹ tó dá owó kankan padà.",
    call_old_number: "Ẹ pe ẹni náà sórí nọ́mbà rẹ̀ àtijọ́ kí ẹ tó fi owó ránṣẹ́.",
    never_pay_fee: "Ẹ má san owó kankan. Ẹ̀bùn tòótọ́ kì í béèrè owó ìforúkọsílẹ̀.",
    call_bank: "Bí ẹ kò bá dá a lójú, ẹ pe ilé-ìfowópamọ́ yín pẹ̀lú nọ́mbà orí káàdì yín tàbí kí ẹ lọ sí ẹ̀ka wọn.",
    pause: "Ẹ fara balẹ̀. Kò sí ilé-ìfowópamọ́ tòótọ́ tí yóò jẹ yín níyà nítorí pé ẹ ṣàyẹ̀wò.",
  },
  ha: {
    never_share: "Kada ku taɓa ba kowa PIN, OTP, BVN ko kalmar sirrinku.",
    no_link: "Kada ku buɗe mahaɗin. Ku yi amfani da manhajar bankinku ko lambar da ke bayan katinku.",
    check_app: "Ku duba ma'aunin kuɗinku a manhajar banki, ba a SMS ba, kafin ku mayar da komai.",
    call_old_number: "Ku kira mutumin a tsohuwar lambarsa kafin ku tura kowane kuɗi.",
    never_pay_fee: "Kada ku biya kowane kuɗi. Tallafi ko kyauta na gaskiya ba sa neman kuɗi.",
    call_bank: "Idan ba ku da tabbas, ku kira bankinku da lambar da ke kan katinku ko ku je reshensu.",
    pause: "Ku ɗauki lokacinku. Babu banki na gaskiya da zai hukunta ku saboda kun bincika.",
  },
  ig: {
    never_share: "Enyela onye ọ bụla PIN, OTP, BVN ma ọ bụ password gị.",
    no_link: "Emepela njikọ ahụ. Jiri ngwa ụlọ akụ gị ma ọ bụ nọmba dị n'azụ kaadị gị.",
    check_app: "Lelee ego dị n'akaụntụ gị na ngwa ụlọ akụ, ọ bụghị na SMS, tupu i zighachi ihe ọ bụla.",
    call_old_number: "Kpọọ onye ahụ na nọmba ochie ya tupu i ziga ego ọ bụla.",
    never_pay_fee: "Akwụla ụgwọ ọ bụla. Ezigbo onyinye anaghị arịọ ụgwọ.",
    call_bank: "Ọ bụrụ na o doghị gị anya, kpọọ ụlọ akụ gị na nọmba dị na kaadị gị ma ọ bụ gaa alaka ha.",
    pause: "Were oge gị. Ọ dịghị ezigbo ụlọ akụ ga-ata gị ahụhụ maka na i lelere mbụ.",
  },
};

const ACTIONS_FOR: Record<FlagCategory, ActionKey[]> = {
  credential_request: ["never_share", "call_bank"],
  suspicious_link: ["no_link", "call_bank"],
  lookalike_sender: ["call_bank", "no_link"],
  urgency_threat: ["pause", "call_bank"],
  new_number: ["call_old_number", "pause"],
  advance_fee: ["never_pay_fee", "pause"],
  too_good_to_be_true: ["never_pay_fee", "never_share"],
  fake_credit_alert: ["check_app", "call_bank"],
  secrecy_pressure: ["call_old_number", "pause"],
  authority_impersonation: ["call_bank", "never_share"],
  off_channel_contact: ["call_bank", "pause"],
  model_judgement: ["pause", "call_bank"],
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Most important categories first, one entry per category. */
export function topCategories(flags: RedFlag[], n: number): FlagCategory[] {
  const sorted = [...flags].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const out: FlagCategory[] = [];
  for (const f of sorted) if (!out.includes(f.category)) out.push(f.category);
  return out.slice(0, n);
}

export function templateExplanation(lang: Lang, verdict: Verdict, flags: RedFlag[]): Explanation {
  const cats = topCategories(flags, 2).filter((c): c is Why => c !== "model_judgement");
  const summary = [HEADLINE[lang][verdict], ...cats.map((c) => WHY[lang][c])].join(" ");

  const keys: ActionKey[] = [];
  for (const c of topCategories(flags, 3)) for (const k of ACTIONS_FOR[c]) if (!keys.includes(k)) keys.push(k);
  if (verdict === "no_red_flags") keys.splice(0, keys.length, "call_bank", "never_share");
  if (keys.length === 0) keys.push("pause", "call_bank");

  return { summary, actions: keys.slice(0, 3).map((k) => ACTION[lang][k]) };
}
