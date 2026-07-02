BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] ADD [assessorGateway2] NVARCHAR(1000),
[assessorGateway3] NVARCHAR(1000),
[examinationWebsite] NVARCHAR(1000),
[examiningInspector1] NVARCHAR(1000),
[examiningInspector2] NVARCHAR(1000),
[examiningInspector3] NVARCHAR(1000),
[programmeOfficer] NVARCHAR(1000),
[qaInspector1] NVARCHAR(1000),
[qaInspector2] NVARCHAR(1000),
[qaInspector3] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
