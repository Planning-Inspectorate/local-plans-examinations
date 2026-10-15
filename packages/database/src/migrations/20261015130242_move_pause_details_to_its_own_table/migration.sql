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

-- CreateTable
CREATE TABLE [dbo].[ExaminationPause] (
    [createdDate] DATETIME2 NOT NULL,
    [startDate] DATETIME2 NOT NULL,
    [details] NVARCHAR(1000),
    [endDate] DATETIME2,
    [examinationInfoId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ExaminationPause_pkey] PRIMARY KEY CLUSTERED ([examinationInfoId],[createdDate],[startDate])
);

-- AddForeignKey
ALTER TABLE [dbo].[ExaminationPause] ADD CONSTRAINT [ExaminationPause_examinationInfoId_fkey] FOREIGN KEY ([examinationInfoId]) REFERENCES [dbo].[ExaminationInfo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
