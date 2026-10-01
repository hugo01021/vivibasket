import { IconBolt, IconGlobe, IconLayers } from "~/components/ui/icons";

const FEATURES = [
  {
    icon: IconLayers,
    title: "Huit facteurs passés au crible",
    text: "Forme, terrain, confrontations, attaque, défense, rythme, fatigue, blessures : rien n'est laissé au hasard.",
  },
  {
    icon: IconBolt,
    title: "Un verdict en quelques secondes",
    text: "Probabilités chiffrées, score projeté et résumé rédigé, prêts avant que le match ne commence.",
  },
  {
    icon: IconGlobe,
    title: "Trois ligues majeures",
    text: "NBA, EuroLeague et Betclic Élite, avec les matchs du jour mis à jour en continu.",
  },
];

export function FeatureTriad() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <li key={title} className="rounded-card border border-border bg-surface/80 p-5 backdrop-blur-sm">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Icon size={22} />
          </span>
          <h3 className="mt-4 font-display text-base font-bold text-fg">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
