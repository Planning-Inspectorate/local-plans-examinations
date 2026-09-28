BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] ADD [remoteMeetingLink] NVARCHAR(1000),
[remoteMeetingLinkKnown] NVARCHAR(1000),
[workshopAddressLine] NVARCHAR(1000),
[workshopAddressLine2] NVARCHAR(1000),
[workshopDocumentUploadedDate] DATETIME2,
[workshopEndTime] NVARCHAR(1000),
[workshopExpectedDays] NVARCHAR(1000),
[workshopExpectedDaysKnown] NVARCHAR(1000),
[workshopLocationKnown] NVARCHAR(1000),
[workshopLocationType] NVARCHAR(1000),
[workshopPostcode] NVARCHAR(1000),
[workshopTime] NVARCHAR(1000),
[workshopTownOrCity] NVARCHAR(1000),
[workshopVenueName] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[LPA] DROP CONSTRAINT [LPA_lpaName_default];
ALTER TABLE [dbo].[LPA] ADD CONSTRAINT [LPA_lpaName_df] DEFAULT '' FOR [lpaName];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
