/*
  Warnings:

  - You are about to drop the column `completedGateway1Date` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `dsaChecked` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedGateway1Date` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `noticeOfIntention` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `slaReceivedDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `slaSentDate` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [completedGateway1Date],
[dsaChecked],
[estimatedGateway1Date],
[noticeOfIntention],
[slaReceivedDate],
[slaSentDate];

-- CreateTable
CREATE TABLE [dbo].[Gateway1Info] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [caseId] UNIQUEIDENTIFIER NOT NULL,
    [noticeOfIntention] DATETIME2,
    [estimatedGateway1Date] DATETIME2,
    [completedGateway1Date] DATETIME2,
    [slaSentDate] DATETIME2,
    [slaReceivedDate] DATETIME2,
    [dsaChecked] NVARCHAR(1000),
    CONSTRAINT [Gateway1Info_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Gateway1Info_caseId_key] UNIQUE NONCLUSTERED ([caseId])
);

-- CreateTable
CREATE TABLE [dbo].[Gateway2Info] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [caseId] UNIQUEIDENTIFIER NOT NULL,
    [estimatedDate] DATETIME2,
    [actualDate] DATETIME2,
    [validDate] DATETIME2,
    [assessorDate] DATETIME2,
    [assessorAppointmentDate] DATETIME2,
    [workshopDate] DATETIME2,
    [workshopVenue] NVARCHAR(1000),
    [reportIssuedDate] DATETIME2,
    [reportPublishedByLPA] DATETIME2,
    CONSTRAINT [Gateway2Info_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Gateway2Info_caseId_key] UNIQUE NONCLUSTERED ([caseId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway1Info] ADD CONSTRAINT [Gateway1Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway2Info] ADD CONSTRAINT [Gateway2Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
