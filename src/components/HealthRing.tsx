interface HealthRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const getColorClass = (percentage: number): string => {
  if (percentage >= 80) return "text-success";
  if (percentage >= 60) return "text-orange";
  if (percentage >= 40) return "text-warning";
  return "text-danger";
};

const getStrokeColor = (percentage: number): string => {
  if (percentage >= 80) return "hsl(var(--success))";
  if (percentage >= 60) return "hsl(var(--orange))";
  if (percentage >= 40) return "hsl(var(--warning))";
  return "hsl(var(--danger))";
};

const HealthRing = ({ percentage, size = 120, strokeWidth = 8, label }: HealthRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor(percentage)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-heading font-black ${getColorClass(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">{label || "Home IQ"}</span>
    </div>
  );
};

export { HealthRing, getColorClass };
