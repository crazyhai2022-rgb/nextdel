// Low-resource production build for shared hosting (Hostinger Node.js Web App).
//
// Hostinger limits how many threads/processes one account may spawn. The default
// Next.js build starts several workers plus the Rust (SWC) thread pools, which can
// crash with "OS can't spawn worker thread: Resource temporarily unavailable".
// This wrapper caps the native thread pools *before* Next.js loads, then copies the
// static assets next to the standalone server so `.next/standalone/server.js` works.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = process.cwd();

const env = {
  ...process.env,
  // Values already set in the hosting panel win over these defaults.
  TOKIO_WORKER_THREADS: process.env.TOKIO_WORKER_THREADS || "1",
  RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || "1",
  UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || "2",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_ENV: "production",
};

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "build"], { stdio: "inherit", env });
if (result.status !== 0) process.exit(result.status ?? 1);

// Standalone output does not include static assets; copy them so the standalone
// server can serve /_next/static/* (and /public if the project ever adds one).
const standalone = path.join(root, ".next", "standalone");
if (existsSync(standalone)) {
  const staticSrc = path.join(root, ".next", "static");
  if (existsSync(staticSrc)) {
    mkdirSync(path.join(standalone, ".next"), { recursive: true });
    cpSync(staticSrc, path.join(standalone, ".next", "static"), { recursive: true });
  }
  const publicSrc = path.join(root, "public");
  if (existsSync(publicSrc)) cpSync(publicSrc, path.join(standalone, "public"), { recursive: true });
  console.log("[nextdel] Standalone server ready at .next/standalone/server.js");
}
