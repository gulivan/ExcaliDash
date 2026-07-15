#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn, spawnSync } from "node:child_process";

const VERSION = "0.5.1-desktop";
const MAC_ARM64_SHA256 = "9f8f618377a0a2ae70bde1a0c946ad69aeedd12a4083dd6d8a85628f00ab0b2d";
const userApplicationsDir = join(homedir(), "Applications");
const installedMacApp = join(userApplicationsDir, "ExcaliDash.app");

const candidates = {
  darwin: [
    join(installedMacApp, "Contents/MacOS/launcher"),
    "/Applications/ExcaliDash.app/Contents/MacOS/launcher",
  ],
  linux: [join(homedir(), ".local/bin/excalidash"), "/usr/local/bin/excalidash"],
  win32: [join(process.env.LOCALAPPDATA || "", "ExcaliDash", "ExcaliDash.exe")],
};

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${basename(command)} exited with status ${result.status}`);
  }
};

const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};

const installMacArm64 = async () => {
  if (process.arch !== "arm64") {
    throw new Error("The first ExcaliDash desktop release supports Apple silicon Macs only.");
  }

  const workDir = join(tmpdir(), `excalidash-${process.pid}`);
  const dmgPath = join(workDir, "ExcaliDash.dmg");
  const mountPath = join(workDir, "mounted");
  const downloadUrl = `https://github.com/gulivan/ExcaliDash/releases/download/v${VERSION}/stable-macos-arm64-ExcaliDash.dmg`;
  mkdirSync(mountPath, { recursive: true });

  try {
    console.log(`Downloading ExcaliDash ${VERSION}...`);
    const response = await fetch(downloadUrl, { redirect: "follow" });
    if (!response.ok || !response.body) {
      throw new Error(`Download failed (${response.status} ${response.statusText})`);
    }
    await pipeline(Readable.fromWeb(response.body), createWriteStream(dmgPath));
    if ((await sha256(dmgPath)) !== MAC_ARM64_SHA256) {
      throw new Error("The downloaded application failed its checksum verification.");
    }

    run("hdiutil", ["attach", "-nobrowse", "-readonly", "-mountpoint", mountPath, dmgPath]);
    mkdirSync(userApplicationsDir, { recursive: true });
    rmSync(installedMacApp, { recursive: true, force: true });
    run("ditto", [join(mountPath, "ExcaliDash.app"), installedMacApp]);
    run("hdiutil", ["detach", mountPath]);
    console.log(`Installed ExcaliDash in ${userApplicationsDir}`);
  } finally {
    if (existsSync(mountPath)) {
      spawnSync("hdiutil", ["detach", mountPath], { stdio: "ignore" });
    }
    rmSync(workDir, { recursive: true, force: true });
  }
};

let executable = process.env.EXCALIDASH_BINARY || candidates[process.platform]?.find(existsSync);
if (!executable && process.platform === "darwin") {
  try {
    await installMacArm64();
    executable = candidates.darwin.find(existsSync);
  } catch (error) {
    console.error(`Unable to install ExcaliDash: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

if (!executable) {
  console.error([
    `ExcaliDash ${VERSION} does not have an automatic installer for this platform yet.`,
    "Download a build from https://github.com/gulivan/ExcaliDash/releases/latest",
  ].join("\n"));
  process.exit(1);
}

const child = spawn(executable, process.argv.slice(2), {
  detached: true,
  stdio: "ignore",
});
child.unref();
