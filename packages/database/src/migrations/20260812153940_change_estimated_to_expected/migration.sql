/*
  Warnings:

  - You are about to drop the column `estimatedSubmissionForExaminationDate` on the `ExaminationInfo` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedGateway1Date` on the `Gateway1Info` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDate` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDate` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] DROP COLUMN [estimatedSubmissionForExaminationDate];
ALTER TABLE [dbo].[ExaminationInfo] ADD [expectedSubmissionForExaminationDate] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Gateway1Info] DROP COLUMN [estimatedGateway1Date];
ALTER TABLE [dbo].[Gateway1Info] ADD [expectedGateway1Date] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [estimatedDate];
ALTER TABLE [dbo].[Gateway2Info] ADD [expectedDate] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [estimatedDate];
ALTER TABLE [dbo].[Gateway3Info] ADD [expectedDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
