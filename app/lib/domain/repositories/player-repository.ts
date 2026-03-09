import type { GitHubIdentity, PlayerProfile } from "../entities/player-profile";

export interface PlayerRepository {
  findById(id: string): Promise<PlayerProfile | null>;
  upsertGitHubIdentity(identity: GitHubIdentity): Promise<PlayerProfile>;
}
