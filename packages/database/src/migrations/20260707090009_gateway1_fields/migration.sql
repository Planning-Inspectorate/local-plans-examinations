BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] ADD [completedGateway1Date] DATETIME2,
[dsaChecked] NVARCHAR(1000),
[estimatedGateway1Date] DATETIME2,
[noticeOfIntention] DATETIME2,
[slaReceivedDate] DATETIME2,
[slaSentDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
