export type GitHubIdentity = {
  githubId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  email: string | null;
};

export type PlayerProfile = {
  id: string;
  githubId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function hasPlayerHandle(player: PlayerProfile): boolean {
  return player.handle.trim().length > 0;
}
