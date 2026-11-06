// Production start: runs the standalone server when it exists, otherwise `next start`.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const port = process.env.PORT || "3000";
const server = path.join(process.cwd(), ".next", "standalone", "server.js");

let args;
const env = { ...process.env, PORT: port };
if (existsSync(server)) {
  // Linux shells export HOSTNAME as the machine name; the standalone server would then
  // bind only to that interface and the hosting proxy could not reach it.
  env.HOSTNAME = process.env.HOST || "0.0.0.0";
  args = [server];
} else {
  args = [require.resolve("next/dist/bin/next"), "start", "-p", port];
}

const child = spawn(process.execPath, args, { stdio: "inherit", env });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
