/*
  Warnings:

  - You are about to drop the column `planPauseEndDate` on the `ExaminationInfo` table. All the data in the column will be lost.
  - You are about to drop the column `planPauseStartDate` on the `ExaminationInfo` table. All the data in the column will be lost.
  - You are about to alter the column `isSound` on the `ExaminationInfo` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(50)` to `Bit`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ALTER COLUMN [isSound] BIT NULL;
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
