import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const accentStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const;

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  accent?: keyof typeof accentStyles;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  valueClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", valueClassName)}>
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              accentStyles[accent],
            )}
          >
            <Icon className="size-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
