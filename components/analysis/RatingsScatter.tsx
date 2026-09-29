"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type ScatterShapeProps,
  type TooltipContentProps,
} from "recharts";

export interface RatingPoint {
  teamId: string;
  name: string;
  abbreviation: string;
  ortg: number;
  drtg: number;
  net: number;
}

// Valeurs des tokens de app/globals.css (les attributs SVG de Recharts n'acceptent pas les variables CSS partout).
const COLORS = {
  accent: "#ff7a1a",
  surface: "#141418",
  grid: "#26262e",
  axis: "#34343f",
  muted: "#9a9aa6",
  subtle: "#6b6b78",
  fg: "#f4f1ec",
};

const fmt = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = (value: number) => (value > 0 ? `+${fmt(value)}` : value < 0 ? `−${fmt(Math.abs(value))}` : fmt(value));

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function RatingTooltip({ active, payload }: TooltipContentProps) {
  const point = active ? (payload?.[0]?.payload as RatingPoint | undefined) : undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-bold text-fg">{point.name}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 tabular">
        <dt className="text-fg-muted">ORTG</dt>
        <dd className="text-right font-semibold text-fg">{fmt(point.ortg)}</dd>
        <dt className="text-fg-muted">DRTG</dt>
        <dd className="text-right font-semibold text-fg">{fmt(point.drtg)}</dd>
        <dt className="text-fg-muted">Net</dt>
        <dd className="text-right font-semibold text-fg">{signed(point.net)}</dd>
      </dl>
    </div>
  );
}

/**
 * Nuage de points ORTG (x) / DRTG (y, axe inversé : la meilleure défense en haut).
 * En haut à droite : les équipes qui attaquent ET défendent mieux que la moyenne.
 */
export function RatingsScatter({ points, height = 380 }: { points: RatingPoint[]; height?: number }) {
  const avgOrtg = mean(points.map((p) => p.ortg));
  const avgDrtg = mean(points.map((p) => p.drtg));
  // Étiquettes sélectives : les 3 meilleurs et les 3 moins bons net ratings.
  const byNet = [...points].sort((a, b) => b.net - a.net);
  const labeled = new Set([...byNet.slice(0, 3), ...byNet.slice(-3)].map((p) => p.teamId));
  const labelAll = points.length <= 12;

  const renderShape = (props: ScatterShapeProps) => {
    const { cx, cy, isActive } = props;
    const point = props.payload as RatingPoint | undefined;
    if (cx == null || cy == null || !point) return <g />;
    const showLabel = labelAll || labeled.has(point.teamId) || isActive;
    return (
      <g>
        {/* Cible de survol plus grande que le point */}
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle cx={cx} cy={cy} r={isActive ? 7 : 5} fill={COLORS.accent} stroke={COLORS.surface} strokeWidth={2} />
        {showLabel && (
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill={COLORS.muted}>
            {point.abbreviation}
          </text>
        )}
      </g>
    );
  };

  return (
    <figure className="rounded-card border border-border bg-surface p-3 shadow-card sm:p-4">
      <div
        role="img"
        aria-label={`Nuage de points des ratings offensif et défensif de ${points.length} équipes. Le détail chiffré figure dans le tableau.`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 4 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="ortg"
              name="ORTG"
              domain={([min, max]: readonly number[]) => [Math.floor(min - 2), Math.ceil(max + 2)]}
              allowDecimals={false}
              tick={{ fill: COLORS.subtle, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
              label={{ value: "Rating offensif (ORTG) →", position: "insideBottom", offset: -18, fill: COLORS.muted, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="drtg"
              name="DRTG"
              reversed
              domain={([min, max]: readonly number[]) => [Math.floor(min - 2), Math.ceil(max + 2)]}
              allowDecimals={false}
              width={44}
              tick={{ fill: COLORS.subtle, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.axis }}
              label={{ value: "Rating défensif (DRTG) →", angle: -90, position: "insideLeft", offset: 12, fill: COLORS.muted, fontSize: 11, style: { textAnchor: "middle" } }}
            />
            <ReferenceLine x={avgOrtg} stroke={COLORS.axis} strokeDasharray="4 4" />
            <ReferenceLine y={avgDrtg} stroke={COLORS.axis} strokeDasharray="4 4" />
            <Tooltip content={RatingTooltip} cursor={{ stroke: COLORS.axis, strokeDasharray: "3 3" }} isAnimationActive={false} />
            <Scatter data={points} shape={renderShape} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
        <span>Axe vertical inversé : la meilleure défense (DRTG bas) est en haut.</span>
        <span>
          <span className="font-semibold text-fg">↗ En haut à droite</span> : attaque et défense au-dessus de la moyenne.
        </span>
        <span>Pointillés : moyennes de la compétition.</span>
      </figcaption>
    </figure>
  );
}
