import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function PageTransition() {
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();

  if (reducedMotion) {
    return <Outlet />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
