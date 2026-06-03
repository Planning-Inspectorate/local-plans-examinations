/*
  Warnings:

  - Added the required column `caseOfficer` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactDetails` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyStageDates` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpa` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planTitle` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planType` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] ADD [caseOfficer] NVARCHAR(1000) NOT NULL,
[contactDetails] NVARCHAR(1000) NOT NULL,
[keyStageDates] NVARCHAR(1000) NOT NULL,
[lpa] NVARCHAR(1000) NOT NULL,
[planTitle] NVARCHAR(1000) NOT NULL,
[planType] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
