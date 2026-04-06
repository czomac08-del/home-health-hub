interface HealthRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const getColorClass = (percentage: number): string => {
  if (percentage >= 85) return "text-health-green";
  if (percentage >= 70) return "text-health-yellow";
  if (percentage >= 60) return "text-health-amber";
  return "text-health-red";
};

const getStrokeColor = (percentage: number): string => {
  if (percentage >= 85) return "hsl(152, 60%, 50%)";
  if (percentage >= 70) return "hsl(45, 90%, 55%)";
  if (percentage >= 60) return "hsl(30, 90%, 55%)";
  return "hsl(0, 72%, 51%)";
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
            stroke="hsl(210, 10%, 20%)"
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
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getColorClass(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
};

export { HealthRing, getColorClass };
