// Vercel serverless entry point. Vercel invokes any file under `api/` as a
// function that receives (req, res) — an Express app instance is callable
// with exactly that signature, so no adapter/wrapper is needed. This is
// deliberately separate from src/index.ts (which does app.listen(...) for
// local dev / a traditional always-on server) — the two entry points coexist
// without either needing to change.
import { app } from "../src/app.js";

export default app;
