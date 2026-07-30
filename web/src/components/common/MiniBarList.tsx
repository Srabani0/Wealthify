import { cn } from "@/lib/utils";

export interface MiniBarListItem {
  label: string;
  value: number;
}

interface MiniBarListProps {
  items: MiniBarListItem[];
  color?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

// Single-hue magnitude encoding, not a multi-color categorical chart — there's
// no real categorical ramp defined for this brand, and identity-by-color
// across many materials isn't the point here (relative size is).
export function MiniBarList({
  items,
  color = "var(--secondary)",
  formatValue = (v) => v.toLocaleString("en-IN"),
  className,
}: MiniBarListProps) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((i) => i.value), 1);

  if (sorted.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>No data yet</p>;
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {sorted.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
