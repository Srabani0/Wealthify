import type { ReactNode } from "react";

export const authFieldClassName =
  "h-11 rounded-full border-none bg-muted pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-primary/40";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient blurred backdrop, in brand colors */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-5%] size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute right-[-5%] bottom-[-10%] size-96 rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-elevated md:grid-cols-2">
        {/* Left: brand / visual panel */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--primary-dark), var(--primary) 55%, var(--secondary))",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.25), transparent 40%)",
            }}
            aria-hidden="true"
          />

          <h2 className="relative text-3xl leading-tight font-bold text-white text-balance">
            Run Better.
            <br />
            Manage Smarter.
            <br />
            Grow Faster.
          </h2>

          {/* CSS-only glossy orb, no image asset needed */}
          <div className="relative my-8 flex items-center justify-center">
            <div
              className="size-40 rounded-full shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85), rgba(255,255,255,0.05) 30%, var(--secondary) 55%, var(--primary-dark) 100%)",
              }}
              aria-hidden="true"
            />
          </div>

          <div className="relative">
            <h3 className="font-semibold text-white">Business management, simplified</h3>
            <p className="mt-1 text-sm text-white/80">
              Track inventory, orders, purchases, and expenses — all in one place, built for how
              you actually run your shop.
            </p>
          </div>
        </div>

        {/* Right: form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
