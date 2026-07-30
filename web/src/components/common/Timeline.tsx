import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

interface TimelineItemProps {
  icon: ReactNode;
  iconClassName?: string;
  title: ReactNode;
  detail?: ReactNode;
  meta?: ReactNode;
  isLast?: boolean;
}

export function TimelineItem({ icon, iconClassName, title, detail, meta, isLast }: TimelineItemProps) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden="true" />}
      <div
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
          iconClassName ?? "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          {meta}
        </div>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}
