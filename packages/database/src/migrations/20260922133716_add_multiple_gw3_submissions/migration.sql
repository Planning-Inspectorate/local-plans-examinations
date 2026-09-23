/*
  Warnings:

  - You are about to drop the column `completionDate` on the `Gateway3Info` table. All the data in the column will be lost.
  - You are about to drop the column `decision` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Gateway3Info] DROP CONSTRAINT [Gateway3Info_decision_fkey];

-- DropIndex
DROP INDEX [Gateway3Info_decision_idx] ON [dbo].[Gateway3Info];

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [completionDate],
[decision];

-- CreateTable
CREATE TABLE [dbo].[Gateway3Submission] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [decision] NVARCHAR(50),
    [completionDate] DATETIME2,
    [gateway3InfoId] UNIQUEIDENTIFIER,
    CONSTRAINT [Gateway3Submission_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Submission] ADD CONSTRAINT [Gateway3Submission_gateway3InfoId_fkey] FOREIGN KEY ([gateway3InfoId]) REFERENCES [dbo].[Gateway3Info]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Submission] ADD CONSTRAINT [Gateway3Submission_decision_fkey] FOREIGN KEY ([decision]) REFERENCES [dbo].[Gateway3Decision]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
