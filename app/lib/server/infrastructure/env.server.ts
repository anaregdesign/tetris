import "dotenv/config";

type SqlServerAuthMode = "default-azure-credential" | "sql-password";

type SqlServerRuntimeConfig =
  | {
      server: string;
      port: number;
      database: string;
      authentication: {
        type: "azure-active-directory-default";
        options: {};
      };
      options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
      };
    }
  | {
      server: string;
      port: number;
      database: string;
      user: string;
      password: string;
      options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
      };
    };

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function parseIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer.`);
  }

  return parsed;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();

  if (!raw) {
    return fallback;
  }

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  throw new Error(`${name} must be either "true" or "false".`);
}

function getSqlServerAuthMode(): SqlServerAuthMode {
  const configuredMode = process.env["SQLSERVER_AUTH_MODE"]?.trim();

  if (!configuredMode) {
    return "default-azure-credential";
  }

  if (
    configuredMode === "default-azure-credential" ||
    configuredMode === "sql-password"
  ) {
    return configuredMode;
  }

  throw new Error(
    'SQLSERVER_AUTH_MODE must be "default-azure-credential" or "sql-password".',
  );
}

export function getSqlServerRuntimeConfig(): SqlServerRuntimeConfig {
  const baseConfig = {
    server: requireEnv("SQLSERVER_HOST"),
    port: parseIntegerEnv("SQLSERVER_PORT", 1433),
    database: requireEnv("SQLSERVER_DATABASE"),
    options: {
      encrypt: parseBooleanEnv("SQLSERVER_ENCRYPT", true),
      trustServerCertificate: parseBooleanEnv(
        "SQLSERVER_TRUST_SERVER_CERTIFICATE",
        false,
      ),
    },
  };

  if (getSqlServerAuthMode() === "default-azure-credential") {
    return {
      ...baseConfig,
      authentication: {
        type: "azure-active-directory-default",
        options: {},
      },
    };
  }

  return {
    ...baseConfig,
    user: requireEnv("SQLSERVER_USER"),
    password: requireEnv("SQLSERVER_PASSWORD"),
  };
}

export function getSessionSecrets(): string[] {
  const configuredSecrets =
    process.env["SESSION_SECRET"]
      ?.split(",")
      .map((secret) => secret.trim())
      .filter(Boolean) ?? [];

  if (configuredSecrets.length > 0) {
    return configuredSecrets;
  }

  if (process.env["NODE_ENV"] !== "production") {
    return ["development-session-secret-change-me"];
  }

  throw new Error("SESSION_SECRET is required in production.");
}

export function isGitHubAuthConfigured(): boolean {
  return Boolean(process.env["GITHUB_CLIENT_ID"] && process.env["GITHUB_CLIENT_SECRET"]);
}

export function getGitHubAuthConfig() {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth environment variables are missing.");
  }

  return {
    clientId,
    clientSecret,
  };
}
