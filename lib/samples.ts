export interface Sample {
  label: string;
  text: string;
}

/** Demo messages. All synthetic: fake numbers, masked accounts, no real people. */
export const SAMPLES: Sample[] = [
  {
    label: "BVN blocked",
    text: "FirstBank-Alertz: Your account has been blocked due to incomplete BVN update. Verify your BVN at http://firstbank-bvn-update.com within 24hrs to avoid permanent restriction.",
  },
  {
    label: "“Sent by mistake”",
    text: "Good evening ma, I mistakenly sent N50,000 to your account instead of my brother. Please kindly refund it back to me, I am stranded. God bless you.",
  },
  {
    label: "New number",
    text: "Mummy na my new number be dis o. My phone fall inside water. Abeg send me 15k sharp sharp, I no fit call now. No tell daddy.",
  },
  {
    label: "FG grant (Hausa)",
    text: "Barka! An zaɓe ku don tallafin gwamnatin tarayya na naira dubu ɗari biyu. Ku biya kuɗin rajista naira dubu biyu yau.",
  },
  {
    label: "Real debit alert",
    text: "Acct:******4821 DR:NGN2,500.00 Desc:POS PURCHASE SHOPRITE IKEJA Avail Bal:NGN48,210.55 Date:12-10-2026 14:02",
  },
];
