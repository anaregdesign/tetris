import { afterEach, describe, expect, it } from "vitest";

import { getSqlServerRuntimeConfig } from "./env.server";

const envKeys = [
  "SQLSERVER_HOST",
  "SQLSERVER_PORT",
  "SQLSERVER_DATABASE",
  "SQLSERVER_AUTH_MODE",
  "SQLSERVER_USER",
  "SQLSERVER_PASSWORD",
  "SQLSERVER_ENCRYPT",
  "SQLSERVER_TRUST_SERVER_CERTIFICATE",
] as const;

const originalEnv = new Map(
  envKeys.map((key) => [key, process.env[key]]),
);

function restoreEnv() {
  for (const key of envKeys) {
    const value = originalEnv.get(key);

    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}

function setBaseEnv() {
  process.env["SQLSERVER_HOST"] = "tetris-sql.database.windows.net";
  process.env["SQLSERVER_DATABASE"] = "tetris";
  delete process.env["SQLSERVER_PORT"];
  delete process.env["SQLSERVER_AUTH_MODE"];
  delete process.env["SQLSERVER_USER"];
  delete process.env["SQLSERVER_PASSWORD"];
  delete process.env["SQLSERVER_ENCRYPT"];
  delete process.env["SQLSERVER_TRUST_SERVER_CERTIFICATE"];
}

afterEach(() => {
  restoreEnv();
});

describe("getSqlServerRuntimeConfig", () => {
  it("uses DefaultAzureCredential by default", () => {
    setBaseEnv();

    expect(getSqlServerRuntimeConfig()).toEqual({
      server: "tetris-sql.database.windows.net",
      port: 1433,
      database: "tetris",
      authentication: {
        type: "azure-active-directory-default",
        options: {},
      },
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    });
  });

  it("supports sql-password auth for local development", () => {
    setBaseEnv();
    process.env["SQLSERVER_AUTH_MODE"] = "sql-password";
    process.env["SQLSERVER_USER"] = "sa";
    process.env["SQLSERVER_PASSWORD"] = "StrongPassword!123";
    process.env["SQLSERVER_PORT"] = "1533";
    process.env["SQLSERVER_ENCRYPT"] = "false";
    process.env["SQLSERVER_TRUST_SERVER_CERTIFICATE"] = "true";

    expect(getSqlServerRuntimeConfig()).toEqual({
      server: "tetris-sql.database.windows.net",
      port: 1533,
      database: "tetris",
      user: "sa",
      password: "StrongPassword!123",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    });
  });

  it("rejects unknown auth modes", () => {
    setBaseEnv();
    process.env["SQLSERVER_AUTH_MODE"] = "managed-identity";

    expect(() => getSqlServerRuntimeConfig()).toThrow(
      'SQLSERVER_AUTH_MODE must be "default-azure-credential" or "sql-password".',
    );
  });
});
