import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  subtitle
}) => {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div className="flex-1 min-w-50 p-5 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
          <Activity className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isUp
                ? 'bg-success/15 text-success'
                : isDown
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isUp && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
            {isDown && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="block mt-1 text-xs text-muted-foreground">
          {subtitle}
        </span>
      )}
    </div>
  );
};
export default MetricCard;
