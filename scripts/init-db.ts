import "dotenv/config";

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function resolveDatabasePath(): string {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a SQLite file: URL.");
  }

  const relativePath = databaseUrl.replace(/^file:/, "");
  return resolve(process.cwd(), relativePath);
}

const databasePath = resolveDatabasePath();
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("foreign_keys = ON");

const migrationDirectories = existsSync(resolve(process.cwd(), "prisma/migrations"))
  ? readdirSync(resolve(process.cwd(), "prisma/migrations"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

for (const directory of migrationDirectories) {
  const migrationFile = resolve(process.cwd(), "prisma/migrations", directory, "migration.sql");
  const sql = readFileSync(migrationFile, "utf8");
  database.exec(sql);
}

database.close();
console.log(`SQLite schema is ready at ${databasePath}`);
