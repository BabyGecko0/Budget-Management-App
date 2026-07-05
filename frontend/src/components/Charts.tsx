import { useMemo } from "react";
import { TrendPoint } from "../api/types";
import { MONTHS_SHORT, money } from "../utils/format";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  icon?: string | null;
}

/** Animated donut chart with legend, drawn with SVG stroke arcs. */
export function DonutChart({
  segments,
  currency,
  centerLabel,
}: {
  segments: DonutSegment[];
  currency: string;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;

  let offset = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const arc = { ...s, dash: frac * C, offset };
    offset += frac * C;
    return arc;
  });

  if (segments.length === 0) {
    return <div className="empty-state">No data for this period yet.</div>;
  }

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 180 180" width="190" height="190">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#f3f4f6" strokeWidth="26" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="26"
            strokeDasharray={`${a.dash} ${C - a.dash}`}
            strokeDashoffset={-a.offset}
            transform="rotate(-90 90 90)"
            className="donut-arc"
          >
            <title>{`${a.label}: ${money(a.value, currency)}`}</title>
          </circle>
        ))}
        <text x="90" y="84" textAnchor="middle" fontSize="13" fill="#6b7280">
          {centerLabel}
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1f2937">
          {money(total, currency)}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="legend-row">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-label">
              {s.icon ? `${s.icon} ` : ""}
              {s.label}
            </span>
            <span className="legend-value">{money(s.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grouped bar chart: income vs expenses per month. */
export function TrendChart({ points, currency }: { points: TrendPoint[]; currency: string }) {
  const W = 640;
  const H = 240;
  const PAD = { top: 16, right: 12, bottom: 30, left: 12 };

  const max = useMemo(
    () => Math.max(1, ...points.flatMap((p) => [p.totalIncome, p.totalExpenses])),
    [points]
  );

  if (points.length === 0) {
    return <div className="empty-state">Not enough history yet.</div>;
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / points.length;
  const barW = Math.min(26, groupW / 2.8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-chart" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH * (1 - f)}
          y2={PAD.top + innerH * (1 - f)}
          stroke="#f3f4f6"
        />
      ))}
      {points.map((p, i) => {
        const cx = PAD.left + groupW * i + groupW / 2;
        const hInc = (p.totalIncome / max) * innerH;
        const hExp = (p.totalExpenses / max) * innerH;
        return (
          <g key={i}>
            <rect
              className="trend-bar"
              x={cx - barW - 2}
              y={PAD.top + innerH - hInc}
              width={barW}
              height={hInc}
              rx="4"
              fill="#22c55e"
            >
              <title>{`${MONTHS_SHORT[p.month - 1]} ${p.year} income: ${money(p.totalIncome, currency)}`}</title>
            </rect>
            <rect
              className="trend-bar"
              x={cx + 2}
              y={PAD.top + innerH - hExp}
              width={barW}
              height={hExp}
              rx="4"
              fill="#f87171"
            >
              <title>{`${MONTHS_SHORT[p.month - 1]} ${p.year} spent: ${money(p.totalExpenses, currency)}`}</title>
            </rect>
            <text
              x={cx}
              y={H - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {MONTHS_SHORT[p.month - 1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
