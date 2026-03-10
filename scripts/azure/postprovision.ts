import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import sql from "mssql";

const MIGRATIONS_DIRECTORY = resolve(process.cwd(), "prisma", "migrations");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for Azure postprovision.`);
  }

  return value;
}

function escapeSqlIdentifier(value: string): string {
  return value.replaceAll("]", "]]");
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function getAccessToken(): string {
  return execFileSync(
    "az",
    [
      "account",
      "get-access-token",
      "--resource",
      "https://database.windows.net/",
      "--query",
      "accessToken",
      "-o",
      "tsv",
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  ).trim();
}

async function ensureMigrationTable(pool: sql.ConnectionPool) {
  await pool
    .request()
    .batch(`
IF OBJECT_ID(N'dbo._prisma_migrations', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[_prisma_migrations] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY,
    [checksum] NVARCHAR(64) NOT NULL,
    [finished_at] DATETIME2 NULL,
    [migration_name] NVARCHAR(255) NOT NULL,
    [logs] NVARCHAR(MAX) NULL,
    [rolled_back_at] DATETIME2 NULL,
    [started_at] DATETIME2 NOT NULL CONSTRAINT [_prisma_migrations_started_at_df] DEFAULT SYSUTCDATETIME(),
    [applied_steps_count] INT NOT NULL CONSTRAINT [_prisma_migrations_applied_steps_count_df] DEFAULT 0
  );

  CREATE UNIQUE INDEX [_prisma_migrations_migration_name_key]
  ON [dbo].[_prisma_migrations]([migration_name]);
END
`);
}

async function ensureApplicationAccess(pool: sql.ConnectionPool, appName: string) {
  const escapedIdentifier = escapeSqlIdentifier(appName);

  await pool
    .request()
    .batch(`
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${escapeSqlLiteral(appName)}')
BEGIN
  CREATE USER [${escapedIdentifier}] FROM EXTERNAL PROVIDER;
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.database_role_members drm
  JOIN sys.database_principals role_principal ON drm.role_principal_id = role_principal.principal_id
  JOIN sys.database_principals member_principal ON drm.member_principal_id = member_principal.principal_id
  WHERE role_principal.name = 'db_datareader'
    AND member_principal.name = N'${escapeSqlLiteral(appName)}'
)
BEGIN
  ALTER ROLE [db_datareader] ADD MEMBER [${escapedIdentifier}];
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.database_role_members drm
  JOIN sys.database_principals role_principal ON drm.role_principal_id = role_principal.principal_id
  JOIN sys.database_principals member_principal ON drm.member_principal_id = member_principal.principal_id
  WHERE role_principal.name = 'db_datawriter'
    AND member_principal.name = N'${escapeSqlLiteral(appName)}'
)
BEGIN
  ALTER ROLE [db_datawriter] ADD MEMBER [${escapedIdentifier}];
END;
`);
}

async function getAppliedMigrationNames(pool: sql.ConnectionPool): Promise<Set<string>> {
  const result = await pool.request().query<{
    migration_name: string;
  }>(`
SELECT [migration_name]
FROM [dbo].[_prisma_migrations]
WHERE [finished_at] IS NOT NULL
  AND [rolled_back_at] IS NULL
`);

  return new Set(result.recordset.map((row) => row.migration_name));
}

function listMigrationDirectories(): string[] {
  return readdirSync(MIGRATIONS_DIRECTORY, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function applyPendingMigrations(pool: sql.ConnectionPool) {
  const appliedMigrations = await getAppliedMigrationNames(pool);

  for (const migrationName of listMigrationDirectories()) {
    if (appliedMigrations.has(migrationName)) {
      continue;
    }

    const migrationPath = resolve(
      MIGRATIONS_DIRECTORY,
      migrationName,
      "migration.sql",
    );
    const migrationSql = readFileSync(migrationPath, "utf8");
    const checksum = createHash("sha256").update(migrationSql).digest("hex");

    await pool.request().batch(migrationSql);

    await pool.request().batch(`
INSERT INTO [dbo].[_prisma_migrations] (
  [id],
  [checksum],
  [finished_at],
  [migration_name],
  [logs],
  [rolled_back_at],
  [started_at],
  [applied_steps_count]
)
VALUES (
  N'${randomUUID()}',
  N'${checksum}',
  SYSUTCDATETIME(),
  N'${escapeSqlLiteral(migrationName)}',
  NULL,
  NULL,
  SYSUTCDATETIME(),
  1
);
`);
  }
}

async function main() {
  const token = getAccessToken();
  const server = requireEnv("SQL_SERVER");
  const database = requireEnv("SQL_DATABASE");
  const appName = requireEnv("SERVICE_WEB_NAME");

  const pool = new sql.ConnectionPool({
    server,
    database,
    port: 1433,
    authentication: {
      type: "azure-active-directory-access-token",
      options: {
        token,
      },
    },
    options: {
      encrypt: true,
    },
  });

  await pool.connect();

  try {
    await ensureMigrationTable(pool);
    await ensureApplicationAccess(pool, appName);
    await applyPendingMigrations(pool);
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
