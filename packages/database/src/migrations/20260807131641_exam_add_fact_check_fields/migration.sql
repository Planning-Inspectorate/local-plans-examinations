BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ADD [factCheckActualDate] DATETIME2,
[factCheckDateReceivedFromInspector] DATETIME2,
[factCheckDueDate] DATETIME2,
[factCheckReceivedBackFromLPADate] DATETIME2,
[finalReportIssueDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
