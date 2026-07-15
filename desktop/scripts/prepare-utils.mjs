import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export const selectQueryEngine = (fileNames, binaryTarget) => {
  const marker = `query_engine-${binaryTarget}.`;
  const matches = fileNames.filter(
    (name) => name.includes(marker) && name.endsWith(".node"),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected one Prisma query engine for ${binaryTarget}, found ${matches.length}.`,
    );
  }

  return matches[0];
};

export const pruneDesktopDependencies = (stagedBackendDir) => {
  const relativePaths = [
    "node_modules/.bin/prisma",
    "node_modules/.bin/prisma.cmd",
    "node_modules/.bin/prisma.ps1",
    "node_modules/prisma",
    "node_modules/@prisma/engines",
    "node_modules/@prisma/fetch-engine",
  ];

  for (const relativePath of relativePaths) {
    const path = resolve(stagedBackendDir, relativePath);
    if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  }
};
