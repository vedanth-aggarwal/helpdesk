import { useId, useState } from "react";

interface DayCount {
  date: string;
  count: number;
}

interface TicketsPerDayChartProps {
  data: DayCount[];
}

const WIDTH = 900;
const HEIGHT = 220;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;
const PADDING_LEFT = 32;
const PADDING_RIGHT = 8;
const BAR_GAP = 6;
const BAR_RADIUS = 3;

const BAR_COLOR = "var(--color-primary)";
const GRIDLINE_COLOR = "var(--color-border)";
const AXIS_COLOR = "var(--color-border)";
const MUTED_TEXT = "var(--color-muted-foreground)";

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, height, width / 2);
  const bottom = y + height;

  if (height <= 0) return "";
  if (r <= 0) {
    return `M${x},${bottom} L${x},${y} L${x + width},${y} L${x + width},${bottom} Z`;
  }

  return `M${x},${bottom} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${bottom} Z`;
}

export function TicketsPerDayChart({ data }: TicketsPerDayChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId();

  const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  const slotWidth = data.length > 0 ? chartWidth / data.length : 0;
  const barWidth = Math.max(1, slotWidth - BAR_GAP);

  const yTicks = [0, Math.round(maxCount / 2), maxCount];
  const labelEvery = Math.ceil(data.length / 6);

  const hovered = hoveredIndex !== null ? data[hoveredIndex] : undefined;
  const hoveredX = hoveredIndex !== null ? PADDING_LEFT + hoveredIndex * slotWidth + slotWidth / 2 : 0;

  return (
    <div className="relative rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-medium text-foreground">Tickets per day (last 30 days)</div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label="Bar chart of total tickets created per day over the last 30 days"
      >
        <defs>
          <clipPath id={gradientId}>
            <rect x={0} y={0} width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>

        {yTicks.map((tick) => {
          const y = PADDING_TOP + chartHeight - (tick / maxCount) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke={GRIDLINE_COLOR}
                strokeWidth={1}
              />
              <text x={PADDING_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={MUTED_TEXT}>
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING_LEFT}
          x2={WIDTH - PADDING_RIGHT}
          y1={PADDING_TOP + chartHeight}
          y2={PADDING_TOP + chartHeight}
          stroke={AXIS_COLOR}
          strokeWidth={1}
        />

        {data.map((day, i) => {
          const barHeight = (day.count / maxCount) * chartHeight;
          const x = PADDING_LEFT + i * slotWidth + BAR_GAP / 2;
          const y = PADDING_TOP + chartHeight - barHeight;

          return (
            <g key={day.date}>
              <rect
                x={x}
                y={PADDING_TOP}
                width={barWidth}
                height={chartHeight}
                fill="transparent"
                onPointerEnter={() => setHoveredIndex(i)}
                onPointerLeave={() => setHoveredIndex((current) => (current === i ? null : current))}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex((current) => (current === i ? null : current))}
                tabIndex={0}
                aria-label={`${formatShortDate(day.date)}: ${day.count} ticket${day.count === 1 ? "" : "s"}`}
              />
              {day.count > 0 && (
                <path
                  d={roundedTopBarPath(x, y, barWidth, barHeight, BAR_RADIUS)}
                  fill={BAR_COLOR}
                  opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.6}
                  pointerEvents="none"
                />
              )}
              {i % labelEvery === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill={MUTED_TEXT}
                >
                  {formatShortDate(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${Math.min(92, Math.max(8, (hoveredX / WIDTH) * 100))}%`,
            top: 8,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-medium text-foreground">{hovered.count} ticket{hovered.count === 1 ? "" : "s"}</div>
          <div className="text-muted-foreground">{formatShortDate(hovered.date)}</div>
        </div>
      )}
    </div>
  );
}
