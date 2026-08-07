/*
  Warnings:

  - You are about to drop the column `programmeOfficerEmail` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `programmeOfficerFirstName` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `programmeOfficerLastName` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `assessorName` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [programmeOfficerEmail],
[programmeOfficerFirstName],
[programmeOfficerLastName];

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [assessorName];
ALTER TABLE [dbo].[Gateway3Info] ADD [programmeOfficerEmail] NVARCHAR(1000),
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
