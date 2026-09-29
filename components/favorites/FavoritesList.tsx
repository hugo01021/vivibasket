"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Favorite, FavoriteKind, Match, Team } from "@/types";
import { useFavorites } from "@/hooks/useFavorites";
import { fullPlayerName } from "@/lib/format";
import { MatchRow } from "@/components/match/MatchRow";
import { TeamBadge } from "@/components/team/TeamBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { LiveDot } from "@/components/ui/LiveDot";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { FavoritesPayload } from "./types";

const noopSubscribe = () => () => {};

/** Faux côté serveur et pendant l'hydratation, vrai ensuite (les favoris vivent dans localStorage). */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function idsOf(favorites: Favorite[], kind: FavoriteKind): string[] {
  return favorites.filter((f) => f.kind === kind).map((f) => f.id);
}

function buildQuery(favorites: Favorite[]): string {
  const params = new URLSearchParams();
  const entries: Array<[string, FavoriteKind]> = [
    ["teams", "team"],
    ["players", "player"],
    ["competitions", "competition"],
  ];
  for (const [param, kind] of entries) {
    const ids = idsOf(favorites, kind);
    if (ids.length > 0) params.set(param, ids.join(","));
  }
  return params.toString();
}

/** Trie des éléments selon l'ordre d'ajout des favoris et écarte ceux qui ne sont plus suivis. */
function inFavoriteOrder<T>(items: T[], ids: string[], getId: (item: T) => string): T[] {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return items.filter((item) => rank.has(getId(item))).sort((a, b) => rank.get(getId(a))! - rank.get(getId(b))!);
}

type FetchState = { key: string; data: FavoritesPayload | null; error: boolean };

function Skeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Chargement de vos favoris…</span>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-card border border-border bg-surface" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchBlock({
  title,
  icon,
  matches,
  teams,
}: {
  title: string;
  icon?: ReactNode;
  matches: Match[];
  teams: Map<string, Team>;
}) {
  if (matches.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          {icon}
          {title}
        </h3>
        <span className="text-xs text-fg-subtle tabular">
          {matches.length} match{matches.length > 1 ? "s" : ""}
        </span>
      </header>
      <div className="divide-y divide-border">
        {matches.map((match) => {
          const home = teams.get(match.homeTeamId);
          const away = teams.get(match.awayTeamId);
          if (!home || !away) return null;
          return <MatchRow key={match.id} match={match} homeTeam={home} awayTeam={away} />;
        })}
      </div>
    </section>
  );
}

function FavoriteCard({
  href,
  visual,
  title,
  subtitle,
  kind,
  id,
}: {
  href: string;
  visual: ReactNode;
  title: string;
  subtitle: string;
  kind: FavoriteKind;
  id: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-card border border-border bg-surface pr-2 shadow-card transition-colors hover:border-border-strong">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 rounded-l-card px-3 py-2.5 hover:text-accent">
        {visual}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{title}</span>
          <span className="block truncate text-xs text-fg-muted">{subtitle}</span>
        </span>
      </Link>
      <FavoriteButton kind={kind} id={id} label={title} className="shrink-0" />
    </li>
  );
}

/** Page Favoris : détail des équipes, joueurs et compétitions suivis + matchs des équipes suivies. */
export function FavoritesList() {
  const { favorites } = useFavorites();
  const hydrated = useHydrated();
  const key = useMemo(() => buildQuery(favorites), [favorites]);
  const [state, setState] = useState<FetchState | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!hydrated || key === "") return;
    const controller = new AbortController();
    fetch(`/api/favorites?${key}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FavoritesPayload>;
      })
      .then((data) => setState({ key, data, error: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState((prev) => ({ key, data: prev?.data ?? null, error: true }));
      });
    return () => controller.abort();
  }, [hydrated, key, attempt]);

  if (!hydrated) return <Skeleton />;

  if (favorites.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title="Aucun favori pour le moment">
          Appuyez sur l’étoile « Suivre » depuis la page d’une équipe, d’un joueur ou d’une compétition : vous retrouverez
          ici leurs matchs en direct, à venir et leurs derniers résultats.
        </EmptyState>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {[
            { href: "/equipes", label: "Parcourir les équipes" },
            { href: "/joueurs", label: "Parcourir les joueurs" },
            { href: "/competitions", label: "Parcourir les compétitions" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border bg-surface px-3 py-1.5 font-semibold text-fg-muted hover:border-border-strong hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const data = state?.data ?? null;
  const stale = state?.key !== key;
  const error = state?.key === key && state.error;

  if (!data) {
    if (error) {
      return (
        <div className="space-y-3 text-center">
          <EmptyState title="Impossible de charger vos favoris">Vérifiez votre connexion puis réessayez.</EmptyState>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-hover"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return <Skeleton />;
  }

  // Les données affichées peuvent dater de la requête précédente (retrait d'un favori) :
  // on filtre sur les favoris courants pour que la mise à jour soit immédiate.
  const teamIds = idsOf(favorites, "team");
  const playerIds = idsOf(favorites, "player");
  const competitionIds = idsOf(favorites, "competition");
  const teams = inFavoriteOrder(data.teams, teamIds, (t) => t.id);
  const players = inFavoriteOrder(data.players, playerIds, (p) => p.player.id);
  const competitions = inFavoriteOrder(data.competitions, competitionIds, (c) => c.id);
  const followed = new Set(teamIds);
  const concernsFollowed = (m: Match) => followed.has(m.homeTeamId) || followed.has(m.awayTeamId);
  const live = data.matches.live.filter(concernsFollowed);
  const upcoming = data.matches.upcoming.filter(concernsFollowed);
  const recent = data.matches.recent.filter(concernsFollowed);
  const lookupTeams = new Map(data.lookup.teams.map((t) => [t.id, t]));
  const hasMatches = live.length + upcoming.length + recent.length > 0;

  return (
    <div className="space-y-8" aria-busy={stale}>
      {error && (
        <p role="alert" className="rounded-card border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-fg-muted">
          La mise à jour a échoué : les informations affichées peuvent être incomplètes.{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-semibold text-accent hover:text-accent-hover">
            Réessayer
          </button>
        </p>
      )}

      {teamIds.length > 0 && (
        <section aria-labelledby="titre-fav-matchs">
          <SectionTitle>
            <span id="titre-fav-matchs">Matchs de vos équipes</span>
          </SectionTitle>
          {hasMatches ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <MatchBlock title="En direct" icon={<LiveDot />} matches={live} teams={lookupTeams} />
              <MatchBlock title="À venir" matches={upcoming} teams={lookupTeams} />
              <MatchBlock title="Derniers résultats" matches={recent} teams={lookupTeams} />
            </div>
          ) : (
            <EmptyState title="Aucun match programmé">Vos équipes n’ont pas de match récent ni à venir.</EmptyState>
          )}
        </section>
      )}

      {teams.length > 0 && (
        <section aria-labelledby="titre-fav-equipes">
          <SectionTitle count={teams.length}>
            <span id="titre-fav-equipes">Équipes</span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <FavoriteCard
                key={team.id}
                kind="team"
                id={team.id}
                href={`/equipes/${team.id}`}
                visual={<TeamBadge team={team} size="md" />}
                title={team.name}
                subtitle={team.kind === "national" ? "Sélection nationale" : team.city}
              />
            ))}
          </ul>
        </section>
      )}

      {players.length > 0 && (
        <section aria-labelledby="titre-fav-joueurs">
          <SectionTitle count={players.length}>
            <span id="titre-fav-joueurs">Joueurs</span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map(({ player, team }) => (
              <FavoriteCard
                key={player.id}
                kind="player"
                id={player.id}
                href={`/joueurs/${player.id}`}
                visual={
                  team ? (
                    <TeamBadge team={team} size="md" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">
                      {player.jerseyNumber}
                    </span>
                  )
                }
                title={fullPlayerName(player)}
                subtitle={`#${player.jerseyNumber} · ${player.position}${team ? ` · ${team.name}` : ""}`}
              />
            ))}
          </ul>
        </section>
      )}

      {competitions.length > 0 && (
        <section aria-labelledby="titre-fav-competitions">
          <SectionTitle count={competitions.length}>
            <span id="titre-fav-competitions">Compétitions</span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <FavoriteCard
                key={competition.id}
                kind="competition"
                id={competition.id}
                href={`/competitions/${competition.slug}`}
                visual={
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ backgroundColor: competition.accentColor }}
                  />
                }
                title={competition.name}
                subtitle={`${competition.region} · ${competition.stage}`}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
