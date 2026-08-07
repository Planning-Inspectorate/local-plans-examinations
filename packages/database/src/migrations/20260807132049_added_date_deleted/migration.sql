BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[CaseHistory] DROP CONSTRAINT [CaseHistory_caseId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Case] ADD [deletedDate] DATETIME2;

-- AddForeignKey
ALTER TABLE [dbo].[CaseHistory] ADD CONSTRAINT [CaseHistory_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
