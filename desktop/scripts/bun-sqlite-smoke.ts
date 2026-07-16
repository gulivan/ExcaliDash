import assert from "node:assert/strict";
import { copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const databasePath = resolve(tmpdir(), `excalidash-desktop-${randomUUID()}.db`);
copyFileSync(resolve(import.meta.dirname, "../build/template.db"), databasePath);

const removeDatabase = () => {
  try {
    rmSync(databasePath, { force: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (process.platform === "win32" && (code === "EBUSY" || code === "EPERM")) {
      console.warn(`Temporary smoke database remains locked; leaving it for OS cleanup: ${databasePath}`);
      return;
    }
    throw error;
  }
};

Object.assign(process.env, {
  CSRF_SECRET: "desktop-smoke-csrf-secret-at-least-32-characters",
  DATABASE_URL: `file:${databasePath}`,
  DISABLE_ONBOARDING_GATE: "true",
  FRONTEND_URL: "http://127.0.0.1:32144",
  JWT_SECRET: "desktop-smoke-jwt-secret-at-least-32-characters",
  NODE_ENV: "production",
  UPDATE_CHECK_OUTBOUND: "false",
});

const backend = await import("../build/backend/dist/index.js");
try {
  await backend.configureSqlite();
  const rows = await backend.prisma.$queryRawUnsafe("SELECT 42 AS answer");
  assert.equal(String(rows[0].answer), "42");
  const systemConfig = await backend.prisma.$transaction(async (transaction) => {
    await transaction.systemConfig.create({
      data: { id: "desktop-smoke", registrationEnabled: false },
    });
    return transaction.systemConfig.findUniqueOrThrow({
      where: { id: "desktop-smoke" },
    });
  });
  assert.equal(systemConfig.id, "desktop-smoke");
  await assert.rejects(
    backend.prisma.$transaction(async (transaction) => {
      await transaction.systemConfig.create({
        data: { id: "desktop-rollback", registrationEnabled: false },
      });
      throw new Error("rollback smoke test");
    }),
    /rollback smoke test/,
  );
  assert.equal(
    await backend.prisma.systemConfig.findUnique({
      where: { id: "desktop-rollback" },
    }),
    null,
  );
  await backend.prisma.systemConfig.delete({ where: { id: "desktop-smoke" } });
  console.log("Desktop bun:sqlite Prisma smoke test passed");
} finally {
  await backend.prisma.$disconnect();
  removeDatabase();
}
process.exit(0);
