/*
  Warnings:

  - You are about to drop the column `planPauseEndDate` on the `ExaminationInfo` table. All the data in the column will be lost.
  - You are about to drop the column `planPauseStartDate` on the `ExaminationInfo` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] DROP COLUMN [planPauseEndDate],
[planPauseStartDate];

-- AlterTable
ALTER TABLE [dbo].[PlanPauseHistory] ADD [planPauseEndDate] DATETIME2,
[planPauseEndDetails] NVARCHAR(1000),
[planPauseStartDetails] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
