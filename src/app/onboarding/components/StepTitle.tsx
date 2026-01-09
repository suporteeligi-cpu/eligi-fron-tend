'use client';

export function StepTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-neutral-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
