import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandMarkVariant = "icon" | "logo" | "logo-tagline";

interface BrandMarkProps {
  variant?: BrandMarkVariant;
  className?: string;
}

const SRC_BY_VARIANT: Record<BrandMarkVariant, string> = {
  icon: "/brand/wealthify-mark.svg",
  logo: "/brand/wealthify-logo.png",
  "logo-tagline": "/brand/wealthify-logo.png",
};

// Falls back to a text wordmark if the image 404s — every placement across
// the app renders through this one component, so swapping the underlying
// asset later needs no further code changes anywhere.
export function BrandMark({ variant = "logo", className }: BrandMarkProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    if (variant === "icon") {
      // The SVG mark fills its own square with a gradient (no baked-in
      // background), so unlike the full lockup PNG below it needs no white
      // backing card to read correctly on a dark surface.
      return (
        <img
          src={SRC_BY_VARIANT.icon}
          alt="Wealthify"
          className={cn("object-contain", className)}
          onError={() => setFailed(true)}
        />
      );
    }

    // Wrapped in a white card: the full lockup PNG has an opaque near-white
    // background baked in (no alpha channel), so on a dark-mode surface
    // (sidebar, auth page) it would otherwise show as a mismatched box.
    // A white backing card makes that look deliberate in both themes.
    return (
      <span className={cn("inline-flex rounded-lg bg-white p-1 shadow-sm", className)}>
        <img
          src={SRC_BY_VARIANT[variant]}
          alt="Wealthify"
          className="h-full w-auto object-contain"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
        style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
      >
        W
      </span>
      {variant !== "icon" && <span className="text-lg font-semibold tracking-tight">Wealthify</span>}
      {variant === "logo-tagline" && (
        <span className="text-xs text-muted-foreground">Run Better. Manage Smarter. Grow Faster.</span>
      )}
    </span>
  );
}
