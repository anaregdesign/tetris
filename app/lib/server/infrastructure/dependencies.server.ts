import { createPrismaPlayerRepository } from "./repositories/prisma-player-repository.server";
import { createPrismaScoreRunRepository } from "./repositories/prisma-score-run-repository.server";
import { createGitHubOAuthGateway } from "./gateways/github-oauth-gateway.server";
import { isGitHubAuthConfigured } from "./env.server";
import { prisma } from "./prisma.server";

export function createServerDependencies() {
  return {
    playerRepository: createPrismaPlayerRepository(prisma),
    scoreRunRepository: createPrismaScoreRunRepository(prisma),
    githubOAuthGateway: isGitHubAuthConfigured() ? createGitHubOAuthGateway() : null,
  };
}
