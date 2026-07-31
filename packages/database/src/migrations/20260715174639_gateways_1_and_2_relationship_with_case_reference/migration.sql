BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Gateway1Info] DROP CONSTRAINT [Gateway1Info_caseId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Gateway2Info] DROP CONSTRAINT [Gateway2Info_caseId_fkey];

-- DropIndex
ALTER TABLE [dbo].[Gateway1Info] DROP CONSTRAINT [Gateway1Info_caseId_key];

-- DropIndex
ALTER TABLE [dbo].[Gateway2Info] DROP CONSTRAINT [Gateway2Info_caseId_key];

-- AlterTable
ALTER TABLE [dbo].[Gateway1Info] ALTER COLUMN [caseId] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] ALTER COLUMN [caseId] NVARCHAR(1000) NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[Gateway1Info] ADD CONSTRAINT [Gateway1Info_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- CreateIndex
ALTER TABLE [dbo].[Gateway2Info] ADD CONSTRAINT [Gateway2Info_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway1Info] ADD CONSTRAINT [Gateway1Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([reference]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway2Info] ADD CONSTRAINT [Gateway2Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([reference]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
