import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  pruneDesktopDependencies,
  selectQueryEngine,
} from "../scripts/prepare-utils.mjs";

test("selects only the query engine matching the host binary target", () => {
  const files = [
    "libquery_engine-darwin-arm64.dylib.node",
    "libquery_engine-linux-musl-openssl-3.0.x.so.node",
    "query_engine-windows.dll.node",
  ];

  assert.equal(
    selectQueryEngine(files, "linux-musl-openssl-3.0.x"),
    "libquery_engine-linux-musl-openssl-3.0.x.so.node",
  );
  assert.equal(
    selectQueryEngine(files, "windows"),
    "query_engine-windows.dll.node",
  );
});

test("rejects missing and ambiguous query engines", () => {
  assert.throws(() => selectQueryEngine([], "darwin-arm64"), /found 0/);
  assert.throws(
    () =>
      selectQueryEngine(
        [
          "libquery_engine-darwin-arm64.dylib.node",
          "query_engine-darwin-arm64.dylib.node",
        ],
        "darwin-arm64",
      ),
    /found 2/,
  );
});

test("prunes build-time Prisma packages from only the staged backend", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "localdraw-prune-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  for (const relativePath of [
    "node_modules/prisma",
    "node_modules/@prisma/engines",
    "node_modules/@prisma/fetch-engine",
    "node_modules/@prisma/get-platform",
  ]) {
    const directory = join(root, relativePath);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "package.json"), "{}");
  }
  for (const fileName of ["prisma", "prisma.cmd", "prisma.ps1"]) {
    const path = join(root, "node_modules/.bin", fileName);
    mkdirSync(join(root, "node_modules/.bin"), { recursive: true });
    writeFileSync(path, "shim");
  }

  pruneDesktopDependencies(root);

  const { existsSync } = await import("node:fs");
  assert.equal(existsSync(join(root, "node_modules/prisma")), false);
  assert.equal(existsSync(join(root, "node_modules/@prisma/engines")), false);
  assert.equal(existsSync(join(root, "node_modules/@prisma/fetch-engine")), false);
  assert.equal(existsSync(join(root, "node_modules/@prisma/get-platform")), true);
  assert.equal(existsSync(join(root, "node_modules/.bin/prisma")), false);
  assert.equal(existsSync(join(root, "node_modules/.bin/prisma.cmd")), false);
  assert.equal(existsSync(join(root, "node_modules/.bin/prisma.ps1")), false);
});
