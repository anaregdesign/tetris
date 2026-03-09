BEGIN TRY

BEGIN TRAN;

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo')
BEGIN
    EXEC sp_executesql N'CREATE SCHEMA [dbo];';
END;

CREATE TABLE [dbo].[User] (
    [id] VARCHAR(30) NOT NULL,
    [githubId] VARCHAR(64) NOT NULL,
    [handle] VARCHAR(39) NOT NULL,
    [displayName] NVARCHAR(255) NOT NULL,
    [avatarUrl] VARCHAR(2048),
    [profileUrl] VARCHAR(2048),
    [email] VARCHAR(320),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_githubId_key] UNIQUE NONCLUSTERED ([githubId])
);

CREATE TABLE [dbo].[ScoreRun] (
    [id] VARCHAR(30) NOT NULL,
    [userId] VARCHAR(30) NOT NULL,
    [score] INT NOT NULL,
    [lines] INT NOT NULL,
    [level] INT NOT NULL,
    [durationMs] INT NOT NULL,
    [recordedAt] DATETIME2 NOT NULL CONSTRAINT [ScoreRun_recordedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ScoreRun_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [ScoreRun_userId_recordedAt_idx]
ON [dbo].[ScoreRun]([userId], [recordedAt]);

CREATE NONCLUSTERED INDEX [ScoreRun_score_recordedAt_idx]
ON [dbo].[ScoreRun]([score], [recordedAt]);

ALTER TABLE [dbo].[ScoreRun]
ADD CONSTRAINT [ScoreRun_userId_fkey]
FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id])
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH
