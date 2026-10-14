BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Gateway2Workshop] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [gateway2InfoId] UNIQUEIDENTIFIER,
    [createdDate] DATETIME2 NOT NULL,
    [workshopDate] DATETIME2,
    [workshopTime] NVARCHAR(1000),
    [workshopEndTime] NVARCHAR(1000),
    [workshopExpectedDaysKnown] NVARCHAR(1000),
    [workshopExpectedDays] NVARCHAR(1000),
    [workshopLocationType] NVARCHAR(1000),
    [remoteMeetingLinkKnown] NVARCHAR(1000),
    [remoteMeetingLink] NVARCHAR(1000),
    [workshopLocationKnown] NVARCHAR(1000),
    [workshopVenueName] NVARCHAR(1000),
    [workshopAddressLine] NVARCHAR(1000),
    [workshopAddressLine2] NVARCHAR(1000),
    [workshopTownOrCity] NVARCHAR(1000),
    [workshopPostcode] NVARCHAR(1000),
    CONSTRAINT [Gateway2Workshop_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway2Workshop] ADD CONSTRAINT [Gateway2Workshop_gateway2InfoId_fkey] FOREIGN KEY ([gateway2InfoId]) REFERENCES [dbo].[Gateway2Info]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- MigrateData
INSERT INTO [dbo].[Gateway2Workshop] (
    [id],
    [gateway2InfoId],
    [createdDate],
    [workshopDate],
    [workshopVenueName]
)
SELECT
    NEWID(),
    [id],
    SYSUTCDATETIME(),
    [workshopDate],
    [workshopVenue]
FROM [dbo].[Gateway2Info]
WHERE [workshopDate] IS NOT NULL OR [workshopVenue] IS NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [workshopDate],
[workshopVenue];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
