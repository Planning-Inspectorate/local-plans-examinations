BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ExaminationHearing] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ExaminationInfoID] UNIQUEIDENTIFIER,
    [createdDate] DATETIME2 NOT NULL,
    [hearingComplete] BIT NOT NULL CONSTRAINT [ExaminationHearing_hearingComplete_df] DEFAULT 0,
    [hearingDate] DATETIME2,
    [hearingTime] NVARCHAR(1000),
    [hearingExpectedDaysKnown] NVARCHAR(1000),
    [hearingExpectedDays] NVARCHAR(1000),
    [hearingLocationType] NVARCHAR(1000),
    [hearingRemoteMeetingLinkKnown] NVARCHAR(1000),
    [hearingRemoteMeetingLink] NVARCHAR(1000),
    [hearingLocationKnown] NVARCHAR(1000),
    [hearingVenueName] NVARCHAR(1000),
    [hearingAddressLine] NVARCHAR(1000),
    [hearingAddressLine2] NVARCHAR(1000),
    [hearingTownOrCity] NVARCHAR(1000),
    [hearingPostcode] NVARCHAR(1000),
    CONSTRAINT [ExaminationHearing_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ExaminationHearing] ADD CONSTRAINT [ExaminationHearing_ExaminationInfoID_fkey] FOREIGN KEY ([ExaminationInfoID]) REFERENCES [dbo].[ExaminationInfo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
