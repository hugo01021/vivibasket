import type { MetadataRoute } from "next";
import { ROUTES, siteUrl } from "~/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  const entries: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
    [ROUTES.home, "weekly", 1],
    [ROUTES.matches, "hourly", 0.9],
    [ROUTES.offers, "monthly", 0.8],
    [ROUTES.legal.responsible, "yearly", 0.4],
    [ROUTES.legal.cancel, "yearly", 0.4],
    [ROUTES.legal.terms, "yearly", 0.3],
    [ROUTES.legal.sales, "yearly", 0.3],
    [ROUTES.legal.privacy, "yearly", 0.3],
    [ROUTES.legal.notice, "yearly", 0.2],
  ];
  return entries.map(([path, changeFrequency, priority]) => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority }));
}
