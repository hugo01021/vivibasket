import { ImageResponse } from "next/og";
import { SITE } from "~/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #0b0b0d 0%, #141418 60%, #2e1605 100%)",
          color: "#f4f1ec",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg viewBox="0 0 32 32" width="72" height="72">
            <path d="M13.6 15.2 C 9.6 17.4, 6.2 21.8, 3.6 27.6 C 7.4 23.4, 12 20.6, 18.4 19 Z" fill="#ff6a00" />
            <circle cx="21" cy="11" r="8.6" fill="#ff6a00" />
            <path d="M21 2.4v17.2M12.4 11h17.2" stroke="#1a0b00" strokeWidth="1.55" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, display: "flex" }}>
            Dunk<span style={{ color: "#ff6a00" }}>One</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, display: "flex" }}>{SITE.tagline}</div>
          <div style={{ fontSize: 30, color: "#9a9aa6", display: "flex" }}>Analyse de matchs de basket par IA · NBA, EuroLeague, Betclic Élite</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#9a9aa6" }}>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "2px solid #34343f", display: "flex" }}>Probabilités</span>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "2px solid #34343f", display: "flex" }}>Score projeté</span>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "2px solid #34343f", display: "flex" }}>Résumé IA</span>
          <span style={{ padding: "10px 18px", borderRadius: 999, border: "2px solid #ff6a00", color: "#ff6a00", display: "flex" }}>18+</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
