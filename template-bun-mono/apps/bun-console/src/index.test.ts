import { expect, test } from "bun:test";
import { resolve } from "node:path";

test("logs an example message using the logger workspace package", () => {
  const result = Bun.spawnSync({
    cmd: [process.execPath, "run", "src/index.ts"],
    cwd: resolve(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });

  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString("utf8").trim()).toBe("[EXAMPLE] Hello world!");
});
