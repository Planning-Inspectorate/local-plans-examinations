/*
  Warnings:

  - You are about to drop the column `assessorDateOfAppointment` on the `Gateway3Info` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway3Info] DROP COLUMN [assessorDateOfAppointment];
ALTER TABLE [dbo].[Gateway3Info] ADD [assessorAppointmentDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
