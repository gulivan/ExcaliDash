import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { getCurrentLatestPrismaMigrationName } from "../routes/importExport/shared";

describe("current Prisma migration discovery", () => {
  it("returns the latest concrete migration from the standard Prisma layout", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "excalidash-migrations-"));
    try {
      const migrationsRoot = path.join(root, "prisma/migrations");
      fs.mkdirSync(path.join(migrationsRoot, "20240101000000_initial"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(migrationsRoot, "20240201000000_add_drawings"), {
        recursive: true,
      });

      await expect(getCurrentLatestPrismaMigrationName(root)).resolves.toBe(
        "20240201000000_add_drawings",
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
