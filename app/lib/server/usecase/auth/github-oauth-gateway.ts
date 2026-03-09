import type { GitHubIdentity } from "~/lib/domain/entities/player-profile";

export interface GitHubOAuthGateway {
  createAuthorizationUrl(input: { redirectUri: string; state: string }): string;
  exchangeCodeForIdentity(input: { code: string; redirectUri: string }): Promise<GitHubIdentity>;
}
