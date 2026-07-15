#!/usr/bin/env node

const { rmSync } = require("fs");
const { resolve } = require("path");
const { spawnSync } = require("child_process");

const backendDir = resolve(__dirname, "..");
rmSync(resolve(backendDir, "src/generated/client"), {
  recursive: true,
  force: true,
});

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "generate"], {
  cwd: backendDir,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
