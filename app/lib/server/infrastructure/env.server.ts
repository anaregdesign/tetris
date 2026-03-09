import "dotenv/config";

export function getDatabaseUrl(): string {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
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
