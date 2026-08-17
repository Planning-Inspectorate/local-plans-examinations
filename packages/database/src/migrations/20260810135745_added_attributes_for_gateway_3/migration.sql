/*
  Warnings:

  - You are about to drop the column `assessorGateway3` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `programmeOfficerEmail` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `programmeOfficerFirstName` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `programmeOfficerLastName` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[CaseHistory] DROP CONSTRAINT [CaseHistory_caseId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [assessorGateway3],
[programmeOfficerEmail],
[programmeOfficerFirstName],
[programmeOfficerLastName];


-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] ADD [actualDate] DATETIME2,
[assessorAppointmentDate] DATETIME2,
[assessorName] NVARCHAR(1000),
[completionDate] DATETIME2,
[programmeOfficerEmail] NVARCHAR(1000),
[programmeOfficerFirstName] NVARCHAR(1000),
[programmeOfficerLastName] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[CaseHistory] ADD CONSTRAINT [CaseHistory_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
