import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/client";

export const createPrismaClient = (
  databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db",
): PrismaClient => {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a SQLite file: URL");
  }

  return new PrismaClient({
    adapter: new PrismaBetterSQLite3({ url: databaseUrl }),
  });
};
