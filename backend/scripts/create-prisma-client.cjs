const { PrismaClient } = require("../src/generated/client");
const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");

const createPrismaClient = (databaseUrl = process.env.DATABASE_URL) => {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a SQLite file: URL");
  }

  return new PrismaClient({
    adapter: new PrismaBetterSQLite3({ url: databaseUrl }),
  });
};

module.exports = { createPrismaClient };
