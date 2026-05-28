/*
  Warnings:

  - You are about to drop the `_CaseToContact` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[_CaseToContact] DROP CONSTRAINT [_CaseToContact_A_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[_CaseToContact] DROP CONSTRAINT [_CaseToContact_B_fkey];

-- DropTable
DROP TABLE [dbo].[_CaseToContact];

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
