"use client";

import { useEffect } from "react";

/** Réveille le serveur en arrière-plan (une fois par onglet) pour accélérer la prochaine action. */
export function Prewarm() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("dunkone-reveil")) return;
      sessionStorage.setItem("dunkone-reveil", "1");
    } catch {
      /* stockage indisponible : on réveille quand même */
    }
    fetch("/api/reveil", { cache: "no-store", keepalive: true }).catch(() => {});
  }, []);
  return null;
}
