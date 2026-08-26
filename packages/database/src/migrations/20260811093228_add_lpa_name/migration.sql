/*
  Warnings:

  - Added the required column `lpaName` to the `LPA` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[LPA] ADD [lpaName] NVARCHAR(200) NOT NULL CONSTRAINT [LPA_lpaName_default] DEFAULT '';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
