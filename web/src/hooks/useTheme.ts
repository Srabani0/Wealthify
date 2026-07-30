import { useEffect, useState } from "react";
import {
  applyTheme,
  getStoredThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme";

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  function setTheme(next: ThemePreference) {
    setThemePreference(next);
    setPreference(next);
  }

  return { preference, setTheme };
}
