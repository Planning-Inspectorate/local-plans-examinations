/*
  Warnings:

  - You are about to drop the column `hearingDuration` on the `ExaminationHearing` table. All the data in the column will be lost.
  - You are about to drop the column `hearingEndDate` on the `ExaminationHearing` table. All the data in the column will be lost.
  - You are about to drop the column `planPauseEndDate` on the `ExaminationInfo` table. All the data in the column will be lost.
  - You are about to drop the column `planPauseStartDate` on the `ExaminationInfo` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[PlanPauseHistory] DROP CONSTRAINT [PlanPauseHistory_examinationInfoId_fkey];

-- AlterTable
ALTER TABLE [dbo].[ExaminationHearing] DROP COLUMN [hearingDuration],
[hearingEndDate];

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] DROP COLUMN [planPauseEndDate],
[planPauseStartDate];

-- AlterTable
ALTER TABLE [dbo].[PlanPauseHistory] ADD [planPauseEndDate] DATETIME2,
[planPauseEndDetails] NVARCHAR(1000),
[planPauseStartDetails] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[PlanPauseHistory] ADD CONSTRAINT [PlanPauseHistory_examinationInfoId_fkey] FOREIGN KEY ([examinationInfoId]) REFERENCES [dbo].[ExaminationInfo]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
