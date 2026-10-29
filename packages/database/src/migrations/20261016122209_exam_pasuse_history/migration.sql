BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PlanPauseHistory] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [examinationInfoId] UNIQUEIDENTIFIER NOT NULL,
    [planPauseDate] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PlanPauseHistory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PlanPauseHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PlanPauseHistory_examinationInfoId_idx] ON [dbo].[PlanPauseHistory]([examinationInfoId]);

-- AddForeignKey
ALTER TABLE [dbo].[PlanPauseHistory] ADD CONSTRAINT [PlanPauseHistory_examinationInfoId_fkey] FOREIGN KEY ([examinationInfoId]) REFERENCES [dbo].[ExaminationInfo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
