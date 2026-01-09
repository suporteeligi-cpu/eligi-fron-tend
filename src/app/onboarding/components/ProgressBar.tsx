'use client';

interface ProgressBarProps {
  steps: number;
  current?: number;
}

export function ProgressBar({
  steps,
  current = 1,
}: ProgressBarProps) {
  const percentage = Math.min(
    100,
    Math.max(0, (current / steps) * 100)
  );

  return (
    <div className="w-full h-1 bg-neutral-200">
      <div
        className="h-1 bg-red-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
