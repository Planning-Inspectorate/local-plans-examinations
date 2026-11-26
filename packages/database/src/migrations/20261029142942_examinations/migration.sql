BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] DROP CONSTRAINT [ExaminationInfo_status_df];
ALTER TABLE [dbo].[ExaminationInfo] ADD CONSTRAINT [ExaminationInfo_status_df] DEFAULT 'cannot-start-yet' FOR [status];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
