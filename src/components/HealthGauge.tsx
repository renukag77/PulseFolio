function bandColor(score: number) {
  if (score >= 70) return "var(--positive)";
  if (score >= 40) return "var(--warning)";
  return "var(--negative)";
}

function bandLabel(score: number) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Needs attention";
  return "At risk";
}

export function HealthGauge({ score, size = 208 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = bandColor(clamped);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-semibold tabular-nums" style={{ color }}>
            {Math.round(clamped)}
          </span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: "var(--surface)", color }}
      >
        {bandLabel(clamped)}
      </span>
    </div>
  );
}
