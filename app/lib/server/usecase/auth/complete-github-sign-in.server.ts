import { hasPlayerHandle } from "~/lib/domain/entities/player-profile";
import type { PlayerRepository } from "~/lib/domain/repositories/player-repository";

import type { GitHubOAuthGateway } from "./github-oauth-gateway";

type CompleteGitHubSignInInput = {
  code: string;
  redirectUri: string;
  gateway: GitHubOAuthGateway;
  playerRepository: PlayerRepository;
};

export async function completeGitHubSignIn({
  code,
  redirectUri,
  gateway,
  playerRepository,
}: CompleteGitHubSignInInput) {
  const identity = await gateway.exchangeCodeForIdentity({
    code,
    redirectUri,
  });
  const player = await playerRepository.upsertGitHubIdentity(identity);

  if (!hasPlayerHandle(player)) {
    throw new Error("GitHub profile is missing a usable handle.");
  }

  return player;
}
