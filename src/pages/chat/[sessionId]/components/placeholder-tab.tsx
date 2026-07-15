import type { ComponentType } from "react";

export function PlaceholderTab({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <Icon className="size-8 text-muted-foreground/40" />
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="text-xs text-muted-foreground/60">{description}</div>
    </div>
  );
}
