import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  createXiaolaiManifest,
  pruneDesktopDependencies,
  selectQueryEngine,
} from "./prepare-utils.mjs";

const desktopDir = resolve(import.meta.dirname, "..");
const rootDir = resolve(desktopDir, "..");
const backendDir = resolve(rootDir, "backend");
const frontendDir = resolve(rootDir, "frontend");
const buildDir = resolve(desktopDir, "build");
const stagedBackendDir = resolve(buildDir, "backend");
const stagedBackendDistDir = resolve(stagedBackendDir, "dist");
const generatedClientDir = resolve(backendDir, "src/generated/client");
const stagedGeneratedClientDir = resolve(stagedBackendDir, "dist/generated/client");
const templateDb = resolve(buildDir, "template.db");
const xiaolaiManifestPath = resolve(buildDir, "xiaolai-manifest.json");
const requireFromBackend = createRequire(resolve(backendDir, "package.json"));

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

mkdirSync(buildDir, { recursive: true });
run("npm", ["run", "build"], { cwd: backendDir });
run("npm", ["run", "build"], {
  cwd: frontendDir,
  env: {
    ...process.env,
    VITE_API_URL: "http://127.0.0.1:32145",
    VITE_APP_BUILD_LABEL: "Electrobun desktop",
  },
});

const excalidrawPackage = JSON.parse(
  readFileSync(
    resolve(
      frontendDir,
      "node_modules/@excalidraw/excalidraw/package.json",
    ),
    "utf8",
  ),
);
const xiaolaiDir = resolve(frontendDir, "dist/fonts/Xiaolai");
const xiaolaiManifest = createXiaolaiManifest(
  xiaolaiDir,
  excalidrawPackage.version,
);
writeFileSync(xiaolaiManifestPath, JSON.stringify(xiaolaiManifest));
rmSync(xiaolaiDir, { recursive: true, force: true });

rmSync(templateDb, { force: true });
run("npx", ["prisma", "db", "push", "--skip-generate"], {
  cwd: backendDir,
  env: { ...process.env, DATABASE_URL: `file:${templateDb}` },
});

rmSync(stagedBackendDir, { recursive: true, force: true });
mkdirSync(stagedBackendDistDir, { recursive: true });

const electrobunDir = resolve(desktopDir, "node_modules/electrobun");
const electrobunRuntimeDir = readdirSync(electrobunDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("dist-"))
  .map((entry) => resolve(electrobunDir, entry.name))
  .find((directory) =>
    existsSync(
      resolve(directory, process.platform === "win32" ? "bun.exe" : "bun"),
    ),
  );
if (!electrobunRuntimeDir) {
  throw new Error("Could not find Electrobun's host Bun runtime.");
}
const bunExecutable = resolve(
  electrobunRuntimeDir,
  process.platform === "win32" ? "bun.exe" : "bun",
);
run(
  bunExecutable,
  [
    "build",
    resolve(backendDir, "dist/index.js"),
    "--target=bun",
    "--format=cjs",
    "--minify",
    `--outfile=${resolve(stagedBackendDistDir, "index.js")}`,
    "--external=*generated/client",
    "--external=better-sqlite3",
    "--external=bcrypt",
  ],
  { cwd: backendDir, shell: false },
);

const { getBinaryTargetForCurrentPlatform } = requireFromBackend("@prisma/get-platform");
const binaryTarget = await getBinaryTargetForCurrentPlatform();
const queryEngine = selectQueryEngine(readdirSync(generatedClientDir), binaryTarget);
mkdirSync(stagedGeneratedClientDir, { recursive: true });
mkdirSync(resolve(stagedGeneratedClientDir, "runtime"), { recursive: true });
cpSync(
  resolve(backendDir, "dist/generated/client/index.js"),
  resolve(stagedGeneratedClientDir, "index.js"),
);
cpSync(
  resolve(backendDir, "dist/generated/client/runtime/library.js"),
  resolve(stagedGeneratedClientDir, "runtime/library.js"),
);
cpSync(
  resolve(generatedClientDir, "schema.prisma"),
  resolve(stagedGeneratedClientDir, "schema.prisma"),
);
cpSync(
  resolve(generatedClientDir, queryEngine),
  resolve(stagedGeneratedClientDir, queryEngine),
);

const generatedClientProxyDir = resolve(stagedBackendDir, "generated/client");
mkdirSync(generatedClientProxyDir, { recursive: true });
writeFileSync(
  resolve(generatedClientProxyDir, "index.js"),
  'module.exports = require("../../dist/generated/client");\n',
);

const workerDir = resolve(stagedBackendDistDir, "workers");
mkdirSync(workerDir, { recursive: true });
cpSync(
  resolve(backendDir, "dist/workers/db-verify.js"),
  resolve(workerDir, "db-verify.js"),
);

for (const packageName of [
  "bcrypt",
  "better-sqlite3",
  "bindings",
  "file-uri-to-path",
  "node-gyp-build",
]) {
  cpSync(
    resolve(backendDir, "node_modules", packageName),
    resolve(stagedBackendDir, "node_modules", packageName),
    { recursive: true },
  );
}
cpSync(
  resolve(backendDir, "package.json"),
  resolve(stagedBackendDir, "package.json"),
);
pruneDesktopDependencies(stagedBackendDir);
