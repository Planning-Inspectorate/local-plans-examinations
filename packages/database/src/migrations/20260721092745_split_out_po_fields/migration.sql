/*
  Warnings:

  - You are about to drop the column `programmeOfficer` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [programmeOfficer];
ALTER TABLE [dbo].[Case] ADD [programmeOfficerEmail] NVARCHAR(1000),
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
