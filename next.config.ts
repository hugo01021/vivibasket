import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** Anciennes adresses du site précédent : redirigées vers le nouveau parcours. */
const LEGACY_REDIRECTS = [
  { source: "/analyses/:path*", destination: "/analyser" },
  { source: "/competitions/:path*", destination: "/matchs" },
  { source: "/equipes/:path*", destination: "/matchs" },
  { source: "/joueurs/:path*", destination: "/matchs" },
  { source: "/match/:path*", destination: "/matchs" },
  { source: "/favoris", destination: "/compte" },
  { source: "/recherche", destination: "/analyser" },
  { source: "/api/analysis", destination: "/api/analyses" },
  { source: "/api/matches", destination: "/api/matchs" },
  { source: "/api/search", destination: "/api/matchs" },
  { source: "/api/favorites", destination: "/api/analyses" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Le service worker ne doit jamais être mis en cache par le navigateur.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
