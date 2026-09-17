/*
  Warnings:

  - You are about to drop the column `completionDate` on the `Gateway3Info` table. All the data in the column will be lost.
  - You are about to drop the column `decision` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [completionDate],
[decision];

-- CreateTable
CREATE TABLE [dbo].[Gateway3Submission] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [decision] NVARCHAR(1000),
    [completionDate] DATETIME2,
    [gateway3InfoId] UNIQUEIDENTIFIER,
    CONSTRAINT [Gateway3Submission_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Submission] ADD CONSTRAINT [Gateway3Submission_gateway3InfoId_fkey] FOREIGN KEY ([gateway3InfoId]) REFERENCES [dbo].[Gateway3Info]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
