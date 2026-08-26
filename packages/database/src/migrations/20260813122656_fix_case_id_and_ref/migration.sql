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

-- Validate caseId values before replacing the text reference with the Case.id GUID.
IF EXISTS (
    SELECT 1
    FROM [dbo].[ExaminationInfo] AS [examinationInfo]
    LEFT JOIN [dbo].[Case] AS [caseByReference] ON [examinationInfo].[caseId] = [caseByReference].[reference]
    LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [examinationInfo].[caseId]) = [caseById].[id]
    WHERE [caseByReference].[id] IS NULL
    AND [caseById].[id] IS NULL
)
BEGIN
    THROW 51000, 'ExaminationInfo.caseId contains values that do not match Case.reference or Case.id.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway1Info] AS [gateway1Info]
    LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway1Info].[caseId] = [caseByReference].[reference]
    LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway1Info].[caseId]) = [caseById].[id]
    WHERE [caseByReference].[id] IS NULL
    AND [caseById].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway1Info.caseId contains values that do not match Case.reference or Case.id.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway2Info] AS [gateway2Info]
    LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway2Info].[caseId] = [caseByReference].[reference]
    LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway2Info].[caseId]) = [caseById].[id]
    WHERE [caseByReference].[id] IS NULL
    AND [caseById].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway2Info.caseId contains values that do not match Case.reference or Case.id.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway3Info] AS [gateway3Info]
    LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway3Info].[caseId] = [caseByReference].[reference]
    LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway3Info].[caseId]) = [caseById].[id]
    WHERE [caseByReference].[id] IS NULL
    AND [caseById].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway3Info.caseId contains values that do not match Case.reference or Case.id.', 1;
END;

-- Add the replacement columns as UNIQUEIDENTIFIER so SQL Server does not have to cast PLAN/... values.
ALTER TABLE [dbo].[ExaminationInfo] ADD [caseId_new] UNIQUEIDENTIFIER;
ALTER TABLE [dbo].[Gateway1Info] ADD [caseId_new] UNIQUEIDENTIFIER;
ALTER TABLE [dbo].[Gateway2Info] ADD [caseId_new] UNIQUEIDENTIFIER;
ALTER TABLE [dbo].[Gateway3Info] ADD [caseId_new] UNIQUEIDENTIFIER;

UPDATE [examinationInfo]
SET [caseId_new] = COALESCE([caseByReference].[id], [caseById].[id])
FROM [dbo].[ExaminationInfo] AS [examinationInfo]
LEFT JOIN [dbo].[Case] AS [caseByReference] ON [examinationInfo].[caseId] = [caseByReference].[reference]
LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [examinationInfo].[caseId]) = [caseById].[id];

UPDATE [gateway1Info]
SET [caseId_new] = COALESCE([caseByReference].[id], [caseById].[id])
FROM [dbo].[Gateway1Info] AS [gateway1Info]
LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway1Info].[caseId] = [caseByReference].[reference]
LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway1Info].[caseId]) = [caseById].[id];

UPDATE [gateway2Info]
SET [caseId_new] = COALESCE([caseByReference].[id], [caseById].[id])
FROM [dbo].[Gateway2Info] AS [gateway2Info]
LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway2Info].[caseId] = [caseByReference].[reference]
LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway2Info].[caseId]) = [caseById].[id];

UPDATE [gateway3Info]
SET [caseId_new] = COALESCE([caseByReference].[id], [caseById].[id])
FROM [dbo].[Gateway3Info] AS [gateway3Info]
LEFT JOIN [dbo].[Case] AS [caseByReference] ON [gateway3Info].[caseId] = [caseByReference].[reference]
LEFT JOIN [dbo].[Case] AS [caseById] ON TRY_CONVERT(UNIQUEIDENTIFIER, [gateway3Info].[caseId]) = [caseById].[id];

IF EXISTS (SELECT 1 FROM [dbo].[ExaminationInfo] WHERE [caseId_new] IS NULL)
BEGIN
    THROW 51000, 'ExaminationInfo.caseId_new could not be populated from Case.reference or Case.id.', 1;
END;

IF EXISTS (SELECT 1 FROM [dbo].[Gateway1Info] WHERE [caseId_new] IS NULL)
BEGIN
    THROW 51000, 'Gateway1Info.caseId_new could not be populated from Case.reference or Case.id.', 1;
END;

IF EXISTS (SELECT 1 FROM [dbo].[Gateway2Info] WHERE [caseId_new] IS NULL)
BEGIN
    THROW 51000, 'Gateway2Info.caseId_new could not be populated from Case.reference or Case.id.', 1;
END;

IF EXISTS (SELECT 1 FROM [dbo].[Gateway3Info] WHERE [caseId_new] IS NULL)
BEGIN
    THROW 51000, 'Gateway3Info.caseId_new could not be populated from Case.reference or Case.id.', 1;
END;

-- Replace the old text caseId columns with populated UNIQUEIDENTIFIER columns.
ALTER TABLE [dbo].[ExaminationInfo] DROP COLUMN [caseId];
EXEC SP_RENAME N'dbo.ExaminationInfo.caseId_new', N'caseId', N'COLUMN';

-- AlterTable
ALTER TABLE [dbo].[Gateway1Info] DROP COLUMN [caseId];
EXEC SP_RENAME N'dbo.Gateway1Info.caseId_new', N'caseId', N'COLUMN';

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [caseId];
EXEC SP_RENAME N'dbo.Gateway2Info.caseId_new', N'caseId', N'COLUMN';

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [caseId];
EXEC SP_RENAME N'dbo.Gateway3Info.caseId_new', N'caseId', N'COLUMN';

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[Gateway1Info] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[Gateway2Info] ALTER COLUMN [caseId] UNIQUEIDENTIFIER NOT NULL;
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
