import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString("en-IN");

export function AnimatedNumber({ value, format = defaultFormat, className }: AnimatedNumberProps) {
  const reducedMotion = usePrefersReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20, mass: 0.6 });
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(format(value));
      return;
    }
    motionValue.set(value);
    // format is deliberately omitted: callers typically pass an inline
    // formatter, and re-subscribing mid-animation on every render would
    // interrupt the count-up for no benefit at this app's render frequency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion, motionValue]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    return spring.on("change", (latest) => setDisplay(format(latest)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spring, reducedMotion]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}
