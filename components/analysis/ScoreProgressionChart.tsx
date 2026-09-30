"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { ScorePoint, ScoreProgression } from "./score-progression";

/* Tokens de globals.css uniquement : domicile orange, extérieur bleu, grille et axes aux couleurs des bordures / texte secondaire. */
const HOME_COLOR = "var(--color-accent)";
const AWAY_COLOR = "var(--color-info)";
const GRID_COLOR = "var(--color-border)";
const AXIS_COLOR = "var(--color-fg-muted)";
const SURFACE = "var(--color-surface)";

interface TeamLabel {
  name: string;
  abbreviation: string;
}

function ProgressionTooltip({
  active,
  payload,
  home,
  away,
}: TooltipContentProps<number, string> & { home: TeamLabel; away: TeamLabel }) {
  const point = payload?.[0]?.payload as ScorePoint | undefined;
  if (!active || !point) return null;
  const diff = point.home - point.away;
  const leader = diff > 0 ? home.abbreviation : diff < 0 ? away.abbreviation : null;
  return (
    <div className="rounded-[4px] border border-border bg-surface-2 px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-fg-muted tabular">{point.label}</p>
      <p className="flex items-center gap-2 tabular">
        <span className="h-0.5 w-3" style={{ backgroundColor: HOME_COLOR }} aria-hidden="true" />
        <span className="text-fg-muted">{home.abbreviation}</span>
        <span className="ml-auto font-bold text-fg">{point.home}</span>
      </p>
      <p className="flex items-center gap-2 tabular">
        <span className="h-0.5 w-3" style={{ backgroundColor: AWAY_COLOR }} aria-hidden="true" />
        <span className="text-fg-muted">{away.abbreviation}</span>
        <span className="ml-auto font-bold text-fg">{point.away}</span>
      </p>
      <p className="mt-1 border-t border-border pt-1 text-fg-muted">{leader ? `${leader} +${Math.abs(diff)}` : "Égalité"}</p>
    </div>
  );
}

/** Évolution du score au fil du match (deux courbes en escalier, une par équipe). */
export function ScoreProgressionChart({
  data,
  home,
  away,
}: {
  data: ScoreProgression;
  home: TeamLabel;
  away: TeamLabel;
}) {
  const { points, periods, totalMinutes } = data;
  const last = points[points.length - 1];
  const midTicks = periods.map((p) => (p.start + p.end) / 2);
  const tickLabel = new Map(midTicks.map((m, i) => [m, periods[i].label]));
  const maxLead = points.reduce(
    (acc, p) => {
      const d = p.home - p.away;
      return { home: Math.max(acc.home, d), away: Math.max(acc.away, -d) };
    },
    { home: 0, away: 0 },
  );

  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-fg">
          <span className="h-0.5 w-4" style={{ backgroundColor: HOME_COLOR }} aria-hidden="true" />
          {home.name}
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-fg">
          <span className="h-0.5 w-4" style={{ backgroundColor: AWAY_COLOR }} aria-hidden="true" />
          {away.name}
        </span>
        <span className="ml-auto text-fg-muted tabular">
          Plus gros écart : {home.abbreviation} +{maxLead.home} · {away.abbreviation} +{maxLead.away}
        </span>
      </div>
      <div className="h-64 w-full sm:h-72" role="img" aria-label={`Évolution du score : ${home.name} ${last?.home ?? 0}, ${away.name} ${last?.away ?? 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="0" vertical={false} />
            {periods.slice(1).map((p) => (
              <ReferenceLine key={p.period} x={p.start} stroke={GRID_COLOR} strokeWidth={1} />
            ))}
            <XAxis
              type="number"
              dataKey="minute"
              domain={[0, totalMinutes]}
              ticks={midTicks}
              tickFormatter={(v: number) => tickLabel.get(v) ?? ""}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: AXIS_COLOR, strokeWidth: 1 }}
              content={(props) => <ProgressionTooltip {...(props as TooltipContentProps<number, string>)} home={home} away={away} />}
            />
            <Line
              type="stepAfter"
              dataKey="home"
              name={home.name}
              stroke={HOME_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="away"
              name={away.name}
              stroke={AWAY_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-xs text-fg-muted">Score cumulé reconstitué à partir du play-by-play, minute par minute.</figcaption>
    </figure>
  );
}
