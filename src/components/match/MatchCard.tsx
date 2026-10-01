import { LEAGUES } from "~/lib/basket/teams";
import type { Fixture } from "~/lib/basket/types";
import { cn, formatTime, parisDateKey } from "~/lib/utils";
import { Badge, LiveBadge } from "~/components/ui/Badge";
import { IconArrowRight, IconClock, IconPin } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { analyzeFixtureAction } from "~/server/actions/analyses";

function kickoffLabel(fixture: Fixture): string {
  const tip = new Date(fixture.tipoff);
  const today = parisDateKey(new Date());
  const day = parisDateKey(tip);
  const time = formatTime(tip);
  if (day === today) return `Aujourd'hui · ${time}`;
  return `Dans la nuit · ${time}`;
}

export function MatchCard({ fixture, highlighted = false }: { fixture: Fixture; highlighted?: boolean }) {
  const league = LEAGUES[fixture.league];
  const live = fixture.status === "live" && fixture.live;
  const finished = fixture.status === "finished";
  return (
    <article
      className={cn(
        "rounded-card border bg-surface p-4 shadow-card transition-colors",
        highlighted ? "border-accent shadow-glow" : "border-border",
      )}
      aria-label={`${fixture.home.name} contre ${fixture.away.name}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="accent">{league.name}</Badge>
          <span className="text-xs text-fg-muted">{fixture.phase}</span>
        </div>
        {live ? <LiveBadge /> : finished ? <Badge tone="muted">Terminé</Badge> : null}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0 space-y-2">
          <TeamLine name={fixture.home.name} short={fixture.home.short} score={live ? fixture.live!.home : undefined} tag="dom." />
          <TeamLine name={fixture.away.name} short={fixture.away.short} score={live ? fixture.live!.away : undefined} tag="ext." />
        </div>
        {live ? (
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-live">{fixture.live!.label}</p>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 text-sm text-fg-muted">
            <IconClock size={16} />
            <span className="tabular whitespace-nowrap">{kickoffLabel(fixture)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-fg-muted">
          <IconPin size={14} className="shrink-0" />
          <span className="truncate">{fixture.venue}</span>
        </p>
        {finished ? null : (
          <form action={analyzeFixtureAction}>
            <input type="hidden" name="matchId" value={fixture.id} />
            <SubmitButton size="sm" variant={highlighted ? "primary" : "outline"} pendingLabel="Préparation…">
              analyser
              <IconArrowRight size={16} />
            </SubmitButton>
          </form>
        )}
      </div>
    </article>
  );
}

function TeamLine({ name, short, score, tag }: { name: string; short: string; score?: number; tag: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-md bg-surface-3 font-display text-xs font-extrabold text-fg">
        {short}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold text-fg">{name}</span>
      <span className="hidden text-[11px] uppercase tracking-wide text-fg-subtle lg:inline">{tag}</span>
      {score !== undefined ? <span className="tabular w-8 shrink-0 text-right font-display text-lg font-extrabold text-fg">{score}</span> : null}
    </div>
  );
}
