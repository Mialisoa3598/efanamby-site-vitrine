// Lance les tests de navigation dans les deux modes (aperçu puis production), l'un après l'autre.
import { spawnSync } from "node:child_process";

const extra = process.argv.slice(2);
let failed = false;
for (const mode of ["preview", "prod"]) {
  console.log(`\n=== Tests de navigation — mode ${mode} ===\n`);
  const r = spawnSync("npx", ["playwright", "test", ...extra], { stdio: "inherit", env: { ...process.env, E2E_MODE: mode } });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
