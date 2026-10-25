import type { Lang } from "./sora/types";

export interface Round {
  text: string;
  sender: string;
  scam: boolean;
}

/**
 * Practice messages for the "Spot the scam" game. Synthetic and anonymised,
 * in the same style as data/eval.jsonl. Lessons for scams come from the rules
 * engine at reveal time, so the game teaches exactly what the checker looks for.
 */
export const POOL: Round[] = [
  { sender: "FirstBank-Alertz", scam: true, text: "Your account has been blocked due to incomplete BVN update. Verify at http://firstbank-bvn-update.com within 24hrs." },
  { sender: "GTBank", scam: false, text: "Debit Acct: 01XXXXX123 Amt: NGN10,000.00 Desc: AIRTIME MTN Avail Bal: NGN12,004.88" },
  { sender: "+234 803 000 0011", scam: true, text: "Good evening ma, I mistakenly sent N50,000 to your account. Please kindly refund it back to me, I am stranded." },
  { sender: "Access", scam: false, text: "Your OTP for transfer of NGN5,000.00 is 482913. Do not share this OTP with anyone. Expires in 5 mins." },
  { sender: "+234 901 000 0022", scam: true, text: "Mummy na my new number be dis o. Abeg send me 15k sharp sharp, I no fit call now. No tell daddy." },
  { sender: "FG-Grants", scam: true, text: "Congratulations! You have been selected for the Federal Government empowerment grant of N250,000. Pay registration fee of N3,500 to claim." },
  { sender: "Jumia", scam: false, text: "Your order 304558821 has been shipped and will be delivered between Oct 27 and Oct 29." },
  { sender: "+234 802 000 0033", scam: true, text: "Hello, we got your CV. You have been shortlisted for a remote job paying $1,500 monthly. Pay N8,000 for your training materials to start." },
  { sender: "Moniepoint", scam: false, text: "Payment of N7,500 received on your POS terminal 2KXX0021. Settlement within 24 hours." },
  { sender: "MTN-Promo", scam: true, text: "Your number has won N2,000,000 in our anniversary draw. Call our agent on 08000000003 with your account details to claim your prize." },
  { sender: "+234 805 000 0044", scam: false, text: "Hi Mum, I've reached school safely. Will call you this evening when I'm back from lectures." },
  { sender: "GIG-Parcel", scam: true, text: "Your parcel is on hold at customs. Pay N6,500 clearance fee at gig-parcel-release.online to avoid return." },
  { sender: "Kuda", scam: false, text: "You sent N5,000 to Musa Ibrahim. Your balance is N22,190." },
  { sender: "+234 706 000 0055", scam: true, text: "Your WhatsApp will be deactivated. Send the 6-digit code you just received to verify your account." },
  { sender: "Wema", scam: false, text: "Dear customer, your token PIN was changed successfully at 14:22. If you did not do this, call 0700 000 0000 immediately." },
  { sender: "+234 813 000 0066", scam: true, text: "Bro I just made 200k from this platform in one week. Use my link to register and deposit, they pay every Friday." },
];

export const ROUNDS = 8;

/** Random game: always a mix, roughly 5 scams and 3 real messages. */
export function newGame(): Round[] {
  const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
  const scams = shuffle(POOL.filter((r) => r.scam)).slice(0, 5);
  const real = shuffle(POOL.filter((r) => !r.scam)).slice(0, ROUNDS - 5);
  return shuffle([...scams, ...real]);
}

export const UI: Record<
  Lang,
  {
    title: string;
    intro: string;
    start: string;
    scam: string;
    real: string;
    right: string;
    wrong: string;
    wasScam: string;
    wasReal: string;
    next: string;
    finish: string;
    again: string;
    share: string;
    score: (n: number, of: number) => string;
    verdict: (n: number, of: number) => string;
    realLesson: string;
    hiddenScam: string;
  }
> = {
  en: {
    title: "Scam or real?",
    intro: "8 messages, about a minute. Learn the signs before the next one lands on your phone.",
    start: "Start",
    scam: "Scam",
    real: "Real",
    right: "Correct!",
    wrong: "Not quite.",
    wasScam: "This one is a scam.",
    wasReal: "This one is real.",
    next: "Next message",
    finish: "See my score",
    again: "Play again",
    share: "Challenge your family",
    score: (n, of) => `${n} of ${of}`,
    verdict: (n, of) => (n === of ? "Perfect. Scammers will struggle with you." : n >= of - 2 ? "Sharp eyes. A little more practice." : "Scammers are good at this. Play again to learn the signs."),
    realLesson: "Real alerts show the amount and balance, have no link, and ask you for nothing.",
    hiddenScam: "No single keyword gives it away, but it asks for money with a promise that's too good. Pause and check.",
  },
  pcm: {
    title: "Scam or real?",
    intro: "8 messages, like one minute. Learn di signs before di next one land for your phone.",
    start: "Start",
    scam: "Scam",
    real: "Real",
    right: "You correct!",
    wrong: "No be am.",
    wasScam: "Dis one na scam.",
    wasReal: "Dis one na real.",
    next: "Next message",
    finish: "See my score",
    again: "Play again",
    share: "Challenge your family",
    score: (n, of) => `${n} out of ${of}`,
    verdict: (n, of) => (n === of ? "Perfect! Scammer no fit you." : n >= of - 2 ? "Your eye sharp. Small practice remain." : "Scammer sabi dis work. Play again make you learn di signs."),
    realLesson: "Real alert dey show amount and balance, e no get link, and e no dey ask you for anything.",
    hiddenScam: "No one word show am, but dem dey ask for money with promise wey too sweet. Calm down and check.",
  },
  yo: {
    title: "Jìbìtì àbí òótọ́?",
    intro: "Ọ̀rọ̀ mẹ́jọ, ní nǹkan bí ìṣẹ́jú kan. Ẹ kọ́ àwọn àmì náà kí èyí tó kàn tó dé orí fóònù yín.",
    start: "Bẹ̀rẹ̀",
    scam: "Jìbìtì",
    real: "Òótọ́",
    right: "Ó tọ̀nà!",
    wrong: "Kò tọ̀nà.",
    wasScam: "Jìbìtì ni èyí.",
    wasReal: "Òótọ́ ni èyí.",
    next: "Ọ̀rọ̀ tó kàn",
    finish: "Wo àmì mi",
    again: "Tún ṣe é",
    share: "Pe ẹbí yín níjà",
    score: (n, of) => `${n} nínú ${of}`,
    verdict: (n, of) => (n === of ? "Ó pé! Àwọn oníjìbìtì kò lè rí yín mú." : n >= of - 2 ? "Ojú yín mú. Ẹ tún ṣe díẹ̀ sí i." : "Àwọn oníjìbìtì mọ iṣẹ́ wọn. Ẹ tún ṣe é láti kọ́ àwọn àmì náà."),
    realLesson: "Ìfitónilétí gidi máa ń fi iye owó àti ìyókù hàn, kò ní ìtọ́ka, kò sì béèrè nǹkan kan lọ́wọ́ yín.",
    hiddenScam: "Kò sí ọ̀rọ̀ kan tó fi hàn ní tààrà, ṣùgbọ́n ó ń béèrè owó pẹ̀lú ìlérí tó pọ̀ jù. Ẹ fara balẹ̀ kí ẹ ṣàyẹ̀wò.",
  },
  ha: {
    title: "Damfara ko gaskiya?",
    intro: "Saƙonni takwas, kusan minti ɗaya. Ku koyi alamomin kafin na gaba ya iso wayarku.",
    start: "Fara",
    scam: "Damfara",
    real: "Gaskiya",
    right: "Daidai ne!",
    wrong: "Ba daidai ba.",
    wasScam: "Wannan damfara ce.",
    wasReal: "Wannan na gaskiya ne.",
    next: "Saƙo na gaba",
    finish: "Duba makina",
    again: "Sake wasa",
    share: "Ƙalubalanci iyalinka",
    score: (n, of) => `${n} cikin ${of}`,
    verdict: (n, of) => (n === of ? "Cikakke! 'Yan damfara ba za su iya ku ba." : n >= of - 2 ? "Idanunku na da kaifi. Ƙara ɗan aiki." : "'Yan damfara sun iya aikinsu. Sake wasa don koyon alamomin."),
    realLesson: "Sanarwa ta gaskiya tana nuna adadin kuɗi da ma'auni, babu mahaɗi, kuma ba ta neman komai daga gare ku.",
    hiddenScam: "Babu kalma ɗaya da ta bayyana shi, amma yana neman kuɗi da alƙawarin da ya yi yawa. Ku dakata ku bincika.",
  },
  ig: {
    title: "Aghụghọ ka ọ bụ eziokwu?",
    intro: "Ozi asatọ, ihe dị ka otu nkeji. Mụta akara ndị ahụ tupu nke ọzọ eruo ekwentị gị.",
    start: "Bido",
    scam: "Aghụghọ",
    real: "Eziokwu",
    right: "Ọ dị mma!",
    wrong: "Ọ bụghị ya.",
    wasScam: "Nke a bụ aghụghọ.",
    wasReal: "Nke a bụ eziokwu.",
    next: "Ozi ọzọ",
    finish: "Hụ akara m",
    again: "Gbalịa ọzọ",
    share: "Maa ezinụlọ gị aka",
    score: (n, of) => `${n} n'ime ${of}`,
    verdict: (n, of) => (n === of ? "Zuru oke! Ndị aghụghọ agaghị enwe ike gị." : n >= of - 2 ? "Anya gị dị nkọ. Mụtakwuo ntakịrị." : "Ndị aghụghọ maara ọrụ ha. Gbalịa ọzọ ka ị mụta akara ndị ahụ."),
    realLesson: "Ezi ozi ego na-egosi ego na ihe fọdụrụ, enweghị njikọ, ọ dịghịkwa ihe ọ na-arịọ gị.",
    hiddenScam: "Ọ dịghị otu okwu kpughere ya, mana ọ na-arịọ ego na nkwa dị oke mma. Kwụsịtụ ma lelee.",
  },
};
