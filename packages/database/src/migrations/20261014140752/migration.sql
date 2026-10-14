/*
  Warnings:

  - You are about to drop the column `hearingEndDate` on the `ExaminationHearing` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationHearing] DROP COLUMN [hearingEndDate];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
