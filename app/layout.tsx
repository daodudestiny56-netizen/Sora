import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// "vietnamese" carries the dot-below vowels (ẹ, ọ) that Yorùbá and Igbo need.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sora-check.vercel.app"),
  title: "Ṣọ́ra — Check a message before you send money",
  description:
    "Ṣọ́ra checks a suspicious SMS, WhatsApp message or screenshot, shows exactly which words are red flags, and explains it in English, Pidgin, Yorùbá, Hausa and Igbo. Works on button phones by SMS and USSD.",
  openGraph: {
    title: "Ṣọ́ra — Be careful before you send money",
    description: "Open-weight AI scam checker for Nigerian families. English, Pidgin, Yorùbá, Hausa, Igbo. Smartphone or button phone.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#f4eee3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="grain min-h-[100dvh] overflow-x-clip">{children}</body>
    </html>
  );
}
