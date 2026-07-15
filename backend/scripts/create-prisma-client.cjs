const { PrismaClient } = require("../src/generated/client");

const createPrismaClient = (databaseUrl = process.env.DATABASE_URL) => {
  if (/^(?:postgres|postgresql):\/\//i.test(databaseUrl || "")) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");
  return new PrismaClient({
    adapter: new PrismaBetterSQLite3({ url: databaseUrl }),
  });
};

module.exports = { createPrismaClient };
