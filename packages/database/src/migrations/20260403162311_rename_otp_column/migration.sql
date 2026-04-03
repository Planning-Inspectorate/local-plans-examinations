/*
  Warnings:

  - You are about to drop the column `hashedOtpCode` on the `OneTimePassword` table. All the data in the column will be lost.
  - Added the required column `hashedOtp` to the `OneTimePassword` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[OneTimePassword] DROP COLUMN [hashedOtpCode];
ALTER TABLE [dbo].[OneTimePassword] ADD [hashedOtp] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
