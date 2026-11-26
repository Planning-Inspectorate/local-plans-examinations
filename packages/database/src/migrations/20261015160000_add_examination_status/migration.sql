BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ExaminationStatus] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [ExaminationStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- SeedData
INSERT INTO [dbo].[ExaminationStatus] ([id], [displayName], [displayOrder]) VALUES
    (N'cannot-start-yet', N'Cannot start yet', 1),
    (N'ready-to-start', N'Ready to start', 2),
    (N'in-progress', N'In progress', 3),
    (N'submitted', N'Submitted', 4),
    (N'in-examination', N'In examination', 5),
    (N'paused', N'Paused', 6),
    (N'report-issued', N'Report issued', 7),
    (N'plan-adopted', N'Plan adopted', 8);

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ADD
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [ExaminationInfo_status_df] DEFAULT N'cannot-start-yet',
    [examinationWebsiteUrl] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ExaminationInfo_status_idx] ON [dbo].[ExaminationInfo]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[ExaminationInfo] ADD CONSTRAINT [ExaminationInfo_status_fkey] FOREIGN KEY ([status]) REFERENCES [dbo].[ExaminationStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
