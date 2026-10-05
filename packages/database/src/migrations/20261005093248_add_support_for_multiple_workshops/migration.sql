/*
  Warnings:

  - You are about to drop the column `remoteMeetingLink` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `remoteMeetingLinkKnown` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopAddressLine` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopAddressLine2` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopDate` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopEndTime` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopExpectedDays` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopExpectedDaysKnown` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopLocationKnown` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopLocationType` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopPostcode` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopTime` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopTownOrCity` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopVenue` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopVenueName` on the `Gateway2Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [remoteMeetingLink],
[remoteMeetingLinkKnown],
[workshopAddressLine],
[workshopAddressLine2],
[workshopDate],
[workshopEndTime],
[workshopExpectedDays],
[workshopExpectedDaysKnown],
[workshopLocationKnown],
[workshopLocationType],
[workshopPostcode],
[workshopTime],
[workshopTownOrCity],
[workshopVenue],
[workshopVenueName];

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

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
