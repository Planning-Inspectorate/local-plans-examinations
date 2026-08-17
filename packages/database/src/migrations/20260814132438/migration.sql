BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] ADD [assessorGateway3] NVARCHAR(1000),
[programmeOfficerEmail] NVARCHAR(1000),
[programmeOfficerFirstName] NVARCHAR(1000),
[programmeOfficerLastName] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
