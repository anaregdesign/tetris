import type { PlayerProfile } from "~/lib/domain/entities/player-profile";
import type { PlayerRepository } from "~/lib/domain/repositories/player-repository";

import type { PrismaClient } from "../generated/prisma/client";

function mapPlayer(record: {
  id: string;
  githubId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PlayerProfile {
  return {
    id: record.id,
    githubId: record.githubId,
    handle: record.handle,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    profileUrl: record.profileUrl,
    email: record.email,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function createPrismaPlayerRepository(prismaClient: PrismaClient): PlayerRepository {
  return {
    async findById(id) {
      const record = await prismaClient.user.findUnique({
        where: { id },
        select: {
          id: true,
          githubId: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          profileUrl: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return record ? mapPlayer(record) : null;
    },
    async upsertGitHubIdentity(identity) {
      const record = await prismaClient.user.upsert({
        where: {
          githubId: identity.githubId,
        },
        create: {
          githubId: identity.githubId,
          handle: identity.handle,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          profileUrl: identity.profileUrl,
          email: identity.email,
        },
        update: {
          handle: identity.handle,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
          profileUrl: identity.profileUrl,
          email: identity.email,
        },
        select: {
          id: true,
          githubId: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          profileUrl: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return mapPlayer(record);
    },
  };
}
