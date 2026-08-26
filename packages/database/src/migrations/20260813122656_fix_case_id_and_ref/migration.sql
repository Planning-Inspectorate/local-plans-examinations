/*
  Warnings:

  - You are about to alter the column `caseId` on the `ExaminationInfo` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `caseId` on the `Gateway1Info` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `caseId` on the `Gateway2Info` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.
  - You are about to alter the column `caseId` on the `Gateway3Info` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `UniqueIdentifier`.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ExaminationInfo] DROP CONSTRAINT [ExaminationInfo_caseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Gateway1Info] DROP CONSTRAINT [Gateway1Info_caseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Gateway2Info] DROP CONSTRAINT [Gateway2Info_caseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Gateway3Info] DROP CONSTRAINT [Gateway3Info_caseId_fkey];

-- DropIndex
ALTER TABLE [dbo].[ExaminationInfo] DROP CONSTRAINT [ExaminationInfo_caseId_key];

-- DropIndex
ALTER TABLE [dbo].[Gateway1Info] DROP CONSTRAINT [Gateway1Info_caseId_key];

-- DropIndex
ALTER TABLE [dbo].[Gateway2Info] DROP CONSTRAINT [Gateway2Info_caseId_key];

-- DropIndex
ALTER TABLE [dbo].[Gateway3Info] DROP CONSTRAINT [Gateway3Info_caseId_key];

-- Backfill caseId values from Case.reference to Case.id before changing the column type.
UPDATE [examinationInfo]
SET [caseId] = CONVERT(NVARCHAR(36), [case].[id])
FROM [dbo].[ExaminationInfo] AS [examinationInfo]
INNER JOIN [dbo].[Case] AS [case] ON [examinationInfo].[caseId] = [case].[reference];

UPDATE [gateway1Info]
SET [caseId] = CONVERT(NVARCHAR(36), [case].[id])
FROM [dbo].[Gateway1Info] AS [gateway1Info]
INNER JOIN [dbo].[Case] AS [case] ON [gateway1Info].[caseId] = [case].[reference];

UPDATE [gateway2Info]
SET [caseId] = CONVERT(NVARCHAR(36), [case].[id])
FROM [dbo].[Gateway2Info] AS [gateway2Info]
INNER JOIN [dbo].[Case] AS [case] ON [gateway2Info].[caseId] = [case].[reference];

UPDATE [gateway3Info]
SET [caseId] = CONVERT(NVARCHAR(36), [case].[id])
FROM [dbo].[Gateway3Info] AS [gateway3Info]
INNER JOIN [dbo].[Case] AS [case] ON [gateway3Info].[caseId] = [case].[reference];

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gateway1Info] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[Gateway1Info] ADD CONSTRAINT [Gateway1Info_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- CreateIndex
ALTER TABLE [dbo].[Gateway2Info] ADD CONSTRAINT [Gateway2Info_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- CreateIndex
ALTER TABLE [dbo].[Gateway3Info] ADD CONSTRAINT [Gateway3Info_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- CreateIndex
ALTER TABLE [dbo].[ExaminationInfo] ADD CONSTRAINT [ExaminationInfo_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway1Info] ADD CONSTRAINT [Gateway1Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway2Info] ADD CONSTRAINT [Gateway2Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Info] ADD CONSTRAINT [Gateway3Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ExaminationInfo] ADD CONSTRAINT [ExaminationInfo_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
