/*
  Warnings:

  - You are about to drop the column `gateway1EstimatedDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Case` table. All the data in the column will be lost.
  - Added the required column `description` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedSubmissionDate` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finallyWorking` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stillWorking` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `working` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [gateway1EstimatedDate],
[name];
ALTER TABLE [dbo].[Case] ADD [description] NVARCHAR(250) NOT NULL,
[estimatedSubmissionDate] DATE NOT NULL,
[finallyWorking] BIT NOT NULL,
[stillWorking] BIT NOT NULL,
[working] BIT NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
