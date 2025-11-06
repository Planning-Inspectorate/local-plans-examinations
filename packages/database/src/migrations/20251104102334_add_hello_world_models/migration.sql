BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[hello_world_questionnaires] (
    [id] NVARCHAR(1000) NOT NULL CONSTRAINT [hello_world_questionnaires_id_df] DEFAULT newid(),
    [title] NVARCHAR(1000) NOT NULL CONSTRAINT [hello_world_questionnaires_title_df] DEFAULT 'Hello World Questionnaire',
    [isActive] BIT NOT NULL CONSTRAINT [hello_world_questionnaires_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [hello_world_questionnaires_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [hello_world_questionnaires_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hello_world_responses] (
    [id] NVARCHAR(1000) NOT NULL CONSTRAINT [hello_world_responses_id_df] DEFAULT newid(),
    [questionnaireId] NVARCHAR(1000) NOT NULL,
    [userName] NVARCHAR(1000) NOT NULL,
    [userMessage] NVARCHAR(1000) NOT NULL,
    [submittedAt] DATETIME2 NOT NULL CONSTRAINT [hello_world_responses_submittedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [hello_world_responses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[hello_world_responses] ADD CONSTRAINT [hello_world_responses_questionnaireId_fkey] FOREIGN KEY ([questionnaireId]) REFERENCES [dbo].[hello_world_questionnaires]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
