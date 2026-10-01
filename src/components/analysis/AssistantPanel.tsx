"use client";

import { useState, type FormEvent } from "react";
import { Card, CardHeader } from "~/components/ui/Card";
import { IconSend, IconSpark } from "~/components/ui/icons";
import type { RedactedResult } from "~/server/analyses/service";

type Message = { role: "user" | "assistant"; text: string };

/** Réponses construites à partir des données de l'analyse (sans appel réseau). */
function answer(result: RedactedResult, question: string): string {
  const q = question.toLowerCase();
  const { match, probabilities, projectedScore, factors, value, injuries, form } = result;
  const fav = probabilities.home >= 50 ? match.home : match.away;
  const pFav = Math.max(probabilities.home, probabilities.away).toFixed(0);

  if (/favori|gagne|vainqueur|qui l'emporte|qui va/.test(q)) {
    return `${fav.name} est favori avec ${pFav} % de chances de victoire. Indice de confiance : ${probabilities.confidence}/100.`;
  }
  if (/total|points|score|over|under/.test(q)) {
    return projectedScore
      ? `Score projeté : ${match.home.name} ${projectedScore.home} – ${projectedScore.away} ${match.away.name}, soit ${projectedScore.total} points au total et un écart de ${projectedScore.spread > 0 ? "+" : ""}${projectedScore.spread} pour l'équipe à domicile.`
      : "Le score projeté est disponible avec l'offre Pro.";
  }
  if (/serr|équilibr|ecart|écart|close/.test(q)) {
    const gap = Math.abs(probabilities.home - probabilities.away);
    return gap < 16
      ? `Oui, c'est un match serré : seulement ${gap.toFixed(0)} points de probabilité séparent les deux équipes.`
      : `Pas vraiment : ${fav.name} se détache avec ${pFav} %, un écart de ${gap.toFixed(0)} points de probabilité.`;
  }
  if (/facteur|cl[ée]|décisif|pourquoi/.test(q)) {
    const top = [...factors].sort((a, b) => Math.abs(b.home - b.away) - Math.abs(a.home - a.away))[0];
    if (!top) return "Les facteurs détaillés sont disponibles avec l'offre Pro.";
    const team = top.edge === "home" ? match.home.name : top.edge === "away" ? match.away.name : "aucune équipe en particulier";
    return `Le facteur le plus discriminant est « ${top.label.toLowerCase()} » (${top.home} contre ${top.away}), à l'avantage de ${team}. ${top.note}.`;
  }
  if (/value|cote|book|march/.test(q)) {
    if (!value) return "Le détecteur de value est disponible avec l'offre Pro.";
    return value.pick
      ? `Value repérée sur ${value.pick === "home" ? match.home.name : match.away.name} : cote de marché ${value.market[value.pick].toFixed(2)} contre une cote juste de ${value.fair[value.pick].toFixed(2)} (+${value.edge[value.pick].toFixed(1)} pt).`
      : `Aucune value nette : le marché (${value.market.home.toFixed(2)} / ${value.market.away.toFixed(2)}) est aligné avec nos cotes justes (${value.fair.home.toFixed(2)} / ${value.fair.away.toFixed(2)}).`;
  }
  if (/bless|absent|infirmerie|forfait/.test(q)) {
    if (!injuries) return "L'infirmerie détaillée est disponible avec l'offre Pro.";
    const list = [
      ...injuries.home.map((i) => `${match.home.short} : ${i.role.toLowerCase()} (${i.issue}, ${i.status})`),
      ...injuries.away.map((i) => `${match.away.short} : ${i.role.toLowerCase()} (${i.issue}, ${i.status})`),
    ];
    return list.length === 0 ? "Les deux effectifs sont au complet." : `Joueurs concernés — ${list.join(" ; ")}.`;
  }
  if (/forme|série|dynamique/.test(q)) {
    const w = (f: Array<"V" | "D">) => f.filter((r) => r === "V").length;
    return `${match.home.name} : ${w(form.home)} victoires sur 5 (${form.home.join("")}). ${match.away.name} : ${w(form.away)} victoires sur 5 (${form.away.join("")}).`;
  }
  if (/direct|live|en cours/.test(q)) {
    return result.live
      ? `Score actuel ${result.live.home}–${result.live.away} (${result.live.label}). Probabilité ${match.home.short} en direct : ${result.live.winProbHome.toFixed(0)} %.`
      : "L'analyse live s'active pendant le match, avec l'offre Elite.";
  }
  return "Je peux répondre sur le favori, le score projeté, les facteurs clés, la forme, les blessures, la value ou le direct. Essayez par exemple : « Quel est le facteur décisif ? »";
}

const STANDARD_QUESTIONS = ["Qui est favori ?", "Quel total de points ?", "Le match sera-t-il serré ?", "Quel est le facteur décisif ?"];
const ADVANCED_QUESTIONS = [...STANDARD_QUESTIONS, "Y a-t-il de la value ?", "Qui est blessé ?", "Et en direct ?"];

export function AssistantPanel({ result, level }: { result: RedactedResult; level: "standard" | "advanced" }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: `Bonjour ! Je connais tous les chiffres de ${result.match.home.name} – ${result.match.away.name}. Que voulez-vous savoir ?` },
  ]);
  const [draft, setDraft] = useState("");
  const questions = level === "advanced" ? ADVANCED_QUESTIONS : STANDARD_QUESTIONS;

  const ask = (question: string) => {
    const text = question.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: answer(result, text) }]);
    setDraft("");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <Card className="p-5">
      <CardHeader
        title={level === "advanced" ? "Assistant IA avancé" : "Assistant IA"}
        subtitle={level === "advanced" ? "Question libre ou suggestions ci-dessous." : "Choisissez une question."}
        aside={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconSpark size={18} />
          </span>
        }
      />
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((m, i) => (
          <p
            key={i}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-br-sm bg-accent-soft px-3.5 py-2 text-sm text-fg"
                : "mr-8 rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2 text-sm text-fg"
            }
          >
            {m.text}
          </p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {questions.map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted hover:border-accent hover:text-accent">
            {q}
          </button>
        ))}
      </div>
      {level === "advanced" ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <label htmlFor="assistant-question" className="sr-only">
            Votre question
          </label>
          <input
            id="assistant-question"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Posez une question sur ce match…"
            className="h-11 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          <button type="submit" aria-label="Envoyer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-hover">
            <IconSend size={18} />
          </button>
        </form>
      ) : null}
    </Card>
  );
}
