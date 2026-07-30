import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface BulkAction {
  label: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
}

// Selecting rows is fully real interaction; the actions themselves have no
// backend support yet, so they surface an honest "coming soon" toast rather
// than doing nothing silently or pretending to succeed.
export function BulkActionBar({ count, actions, onClear }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border bg-popover px-4 py-2 text-sm shadow-elevated">
      <span className="font-medium">{count} selected</span>
      <div className="flex items-center gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.variant ?? "outline"}
            onClick={() => toast.info(`${action.label} — coming soon`)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Clear selection"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
