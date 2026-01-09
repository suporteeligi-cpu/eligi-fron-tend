'use client';

export function StepFooter({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-end pt-6">
      {children}
    </div>
  );
}
