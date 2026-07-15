import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const loadConfig = async () => {
  vi.resetModules();
  return import("./config");
};

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("SQLite database configuration", () => {
  it("normalizes relative SQLite URLs", async () => {
    process.env.DATABASE_URL = "file:./dev.db";

    const { config } = await loadConfig();

    expect(config.databaseUrl).toMatch(/\/prisma\/dev\.db$/);
    expect(config.databaseUrl).toMatch(/^file:/);
  });

  it("rejects non-SQLite database URLs", async () => {
    process.env.DATABASE_URL = "postgresql://localhost/excalidash";

    await expect(loadConfig()).rejects.toThrow(
      "DATABASE_URL must use a SQLite file: URL",
    );
  });
});
