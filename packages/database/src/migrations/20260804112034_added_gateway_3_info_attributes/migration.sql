BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] ADD [actualDate] DATETIME2,
[assessorDateOfAppointment] DATETIME2,
[assessorName] NVARCHAR(1000),
[completionDate] DATETIME2,
[gateway3EstimatedDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
