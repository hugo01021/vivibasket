import type { MetadataRoute } from "next";
import { SITE } from "~/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — analyse de basket par IA`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    categories: ["sports", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Analyser un match", url: "/analyser", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Matchs du jour", url: "/matchs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
