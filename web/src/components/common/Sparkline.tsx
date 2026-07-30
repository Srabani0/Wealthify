import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SparklinePoint {
  label: string;
  value: number;
}

interface SparklineProps {
  data: SparklinePoint[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const VIEW_WIDTH = 300;

// Hand-rolled inline SVG rather than a charting library — this app only
// needs a couple of small single-series trend lines, so a full charting
// dependency (bundle size, API surface) isn't worth it for two sparklines.
export function Sparkline({
  data,
  color = "var(--secondary)",
  height = 64,
  formatValue = (v) => v.toLocaleString("en-IN"),
  className,
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { linePath, areaPath, points, min, max } = useMemo(() => {
    if (data.length === 0) {
      return { linePath: "", areaPath: "", points: [] as { x: number; y: number }[], min: 0, max: 0 };
    }
    const values = data.map((d) => d.value);
    const dataMin = Math.min(0, ...values);
    const dataMax = Math.max(...values, 1);
    const range = dataMax - dataMin || 1;
    const stepX = data.length > 1 ? VIEW_WIDTH / (data.length - 1) : 0;
    const topPad = 6;
    const usableHeight = height - topPad * 2;

    const pts = data.map((d, i) => ({
      x: data.length > 1 ? i * stepX : VIEW_WIDTH / 2,
      y: topPad + usableHeight - ((d.value - dataMin) / range) * usableHeight,
    }));

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${height} L ${pts[0].x.toFixed(2)} ${height} Z`;

    return { linePath: line, areaPath: area, points: pts, min: dataMin, max: dataMax };
  }, [data, height]);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (data.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredDatum = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        className="overflow-visible"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={`Trend from ${formatValue(min)} to ${formatValue(max)}`}
      >
        <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3.5} fill={color} />
        )}
        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={0}
            y2={height}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {hovered && <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />}
      </svg>
      {hovered && hoveredDatum && (
        <div
          className="pointer-events-none absolute top-0 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-elevated"
          style={{ left: `${(hovered.x / VIEW_WIDTH) * 100}%`, transform: "translate(-50%, -8px)" }}
        >
          <span className="font-medium">{formatValue(hoveredDatum.value)}</span>
          <span className="ml-1.5 text-muted-foreground">{hoveredDatum.label}</span>
        </div>
      )}
    </div>
  );
}
