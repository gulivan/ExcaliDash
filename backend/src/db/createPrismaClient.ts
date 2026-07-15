import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

export const createPrismaClient = (
  databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db",
): PrismaClient => {
  const isPostgres = /^(?:postgres|postgresql):\/\//i.test(databaseUrl);
  const adapter = isPostgres
    ? new PrismaPg({ connectionString: databaseUrl })
    : new PrismaBetterSQLite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
};
