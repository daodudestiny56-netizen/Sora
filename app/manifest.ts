import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ṣọ́ra: check a message before you send money",
    short_name: "Ṣọ́ra",
    description:
      "Check a suspicious SMS, WhatsApp message or screenshot. See the red flags and what to do in English, Pidgin, Yorùbá, Hausa or Igbo.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4eee3",
    theme_color: "#0d1330",
    lang: "en",
    categories: ["utilities", "finance", "security"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Android: long-press a suspicious SMS → Share → Ṣọ́ra opens with the text and checks it.
    share_target: {
      action: "/",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
    shortcuts: [{ name: "Check a message", url: "/?source=shortcut#check", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }],
  };
}
