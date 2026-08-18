BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ADD [adoptionDate] DATETIME2,
[approvedForCILDate] DATETIME2,
[isSound] BIT,
[planPauseEndDate] DATETIME2,
[planPauseStartDate] DATETIME2,
[soundUnsoundDate] DATETIME2,
[withdrawnDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
