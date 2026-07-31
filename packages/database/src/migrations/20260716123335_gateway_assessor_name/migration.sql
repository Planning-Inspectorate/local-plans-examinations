/*
  Warnings:

  - You are about to drop the column `assessorDate` on the `Gateway2Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [assessorDate];
ALTER TABLE [dbo].[Gateway2Info] ADD [assessorName] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
