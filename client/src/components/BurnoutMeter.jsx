export const WORKLOAD_LEVELS = [
  { max: 0.33, label: "Light week",    color: "bg-green-400",  text: "text-green-700",  ring: "ring-green-300"  },
  { max: 0.66, label: "Moderate load", color: "bg-yellow-400", text: "text-yellow-700", ring: "ring-yellow-300" },
  { max: 1.00, label: "Heavy week",    color: "bg-orange-400", text: "text-orange-700", ring: "ring-orange-300" },
];

export function getWorkloadLevel(score) {
  return (
    WORKLOAD_LEVELS.find((l) => score <= l.max) ??
    WORKLOAD_LEVELS[WORKLOAD_LEVELS.length - 1]
  );
}

/**
 * Props:
 *   score  — number 0–1  (formerly "burnoutScore")
 *   label? — override the level label
 */
export default function WorkloadBalanceMeter({ score = 0, label }) {
  const level = getWorkloadLevel(score);
  const pct   = Math.round(score * 100);
  const displayLabel = label ?? level.label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Work-pattern load</span>
        <span className={`text-sm font-semibold ${level.text}`}>{displayLabel}</span>
      </div>

      {/* Bar */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${level.color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Work-pattern load: ${pct}%`}
        />
      </div>

      <p className="text-xs text-gray-400">
        This is a rough, non-clinical indicator of your recent work patterns —
        not a medical or mental-health assessment.
      </p>
    </div>
  );
}
