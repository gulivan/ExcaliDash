#!/usr/bin/env node

const { rmSync } = require("fs");
const { resolve } = require("path");
const { spawnSync } = require("child_process");

const backendDir = resolve(__dirname, "..");
rmSync(resolve(backendDir, "src/generated/client"), {
  recursive: true,
  force: true,
});

const prismaCli = require.resolve("prisma/build/index.js", {
  paths: [backendDir],
});
const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  cwd: backendDir,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
