/*
  Warnings:

  - The primary key for the `DocumentSet` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Document] DROP CONSTRAINT [Document_documentSetId_fkey];

-- DropIndex
DROP INDEX [Document_caseId_documentSetId_idx] ON [dbo].[Document];

-- DropIndex
ALTER TABLE [dbo].[Document] DROP CONSTRAINT [Document_name_documentSetId_key];

-- AlterTable
ALTER TABLE [dbo].[Document] ALTER COLUMN [documentSetId] NVARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[DocumentSet] DROP CONSTRAINT [DocumentSet_pkey];
ALTER TABLE [dbo].[DocumentSet] ALTER COLUMN [id] NVARCHAR(100) NOT NULL;
ALTER TABLE [dbo].[DocumentSet] ADD CONSTRAINT DocumentSet_pkey PRIMARY KEY CLUSTERED ([id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_caseId_documentSetId_idx] ON [dbo].[Document]([caseId], [documentSetId]);

-- CreateIndex
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_name_documentSetId_key] UNIQUE NONCLUSTERED ([name], [documentSetId]);

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_documentSetId_fkey] FOREIGN KEY ([documentSetId]) REFERENCES [dbo].[DocumentSet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
