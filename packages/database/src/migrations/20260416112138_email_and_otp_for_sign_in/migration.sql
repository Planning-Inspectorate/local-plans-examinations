/*
  Warnings:

  - The primary key for the `OneTimePassword` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `caseReference` on the `OneTimePassword` table. All the data in the column will be lost.
  - You are about to drop the `EmailActionToken` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[OneTimePassword] DROP CONSTRAINT [OneTimePassword_pkey];
ALTER TABLE [dbo].[OneTimePassword] DROP COLUMN [caseReference];
ALTER TABLE [dbo].[OneTimePassword] ADD CONSTRAINT OneTimePassword_pkey PRIMARY KEY CLUSTERED ([email]);

-- DropTable
DROP TABLE [dbo].[EmailActionToken];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
