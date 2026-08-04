/*
  Warnings:

  - You are about to drop the column `gateway3EstimatedDate` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [gateway3EstimatedDate];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
