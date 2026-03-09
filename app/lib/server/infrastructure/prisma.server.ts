import { PrismaMssql } from "@prisma/adapter-mssql";

import { PrismaClient } from "./generated/prisma/client";
import { getSqlServerRuntimeConfig } from "./env.server";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaMssql(getSqlServerRuntimeConfig());

  return new PrismaClient({
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
