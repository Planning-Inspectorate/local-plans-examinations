/*
  Warnings:

  - You are about to drop the column `description` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedSubmissionDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `finallyWorking` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `stillWorking` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `working` on the `Case` table. All the data in the column will be lost.
  - Added the required column `anotherContact` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `caseOfficer` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadContactEmail` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadContactName` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadContactPhone` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpaName` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planTitle` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondaryLPA` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeOfApplication` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [description],
[estimatedSubmissionDate],
[finallyWorking],
[stillWorking],
[working];
ALTER TABLE [dbo].[Case] ADD [anotherContact] BIT NOT NULL,
[caseOfficer] NVARCHAR(50) NOT NULL,
[leadContactEmail] NVARCHAR(150) NOT NULL,
[leadContactName] NVARCHAR(100) NOT NULL,
[leadContactPhone] NVARCHAR(20) NOT NULL,
[lpaName] NVARCHAR(100) NOT NULL,
[planTitle] NVARCHAR(100) NOT NULL,
[secondaryLPA] BIT NOT NULL,
[typeOfApplication] NVARCHAR(5) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
