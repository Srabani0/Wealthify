import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Array form (not the object form) because order and anchoring both matter
    // here: string-keyed aliases match by PREFIX, so a bare "@" -> ./src entry
    // listed first swallows "@wealthify/shared" and rewrites it to
    // "<root>/src" + "wealthify/shared", which doesn't exist. Anchored regexes
    // evaluated most-specific-first avoid that collision entirely.
    alias: [
      {
        // Runtime counterpart to the tsconfig path of the same name — the
        // shared Zod schemas/types are vendored into this app at src/shared
        // instead of resolved from a workspace package, so `web/` builds
        // standalone with no dependency on anything outside its own folder.
        find: /^@wealthify\/shared$/,
        replacement: path.resolve(__dirname, "./src/shared/index.ts"),
      },
      {
        find: /^@\//,
        replacement: path.resolve(__dirname, "./src") + "/",
      },
    ],
  },
  server: {
    port: 5173,
  },
});
