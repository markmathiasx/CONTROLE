import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const generatedTypeDirs = [".next/types", ".next/dev/types"];

for (const directory of generatedTypeDirs) {
  rmSync(directory, { recursive: true, force: true });
}

for (const command of [
  "npx next typegen",
  "npx tsc --noEmit",
]) {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
