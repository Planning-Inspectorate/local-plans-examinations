/*
  Warnings:

  - You are about to drop the column `leadContactName` on the `Case` table. All the data in the column will be lost.
  - Added the required column `leadContactFirstName` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadContactLastName` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [leadContactName];
ALTER TABLE [dbo].[Case] ADD [leadContactFirstName] NVARCHAR(100) NOT NULL,
[leadContactLastName] NVARCHAR(100) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
