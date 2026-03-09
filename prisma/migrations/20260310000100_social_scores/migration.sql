PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "githubId" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "profileUrl" TEXT,
  "email" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ScoreRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "lines" INTEGER NOT NULL,
  "level" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreRun_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_githubId_key" ON "User"("githubId");
CREATE INDEX IF NOT EXISTS "ScoreRun_userId_recordedAt_idx" ON "ScoreRun"("userId", "recordedAt");
CREATE INDEX IF NOT EXISTS "ScoreRun_score_recordedAt_idx" ON "ScoreRun"("score", "recordedAt");
