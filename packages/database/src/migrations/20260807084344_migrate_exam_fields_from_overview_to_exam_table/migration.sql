/*
  Warnings:

  - You are about to drop the column `examinationWebsite` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `examiningInspector1` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `examiningInspector2` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `examiningInspector3` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [examinationWebsite],
[examiningInspector1],
[examiningInspector2],
[examiningInspector3];

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ADD [examinationWebsite] NVARCHAR(1000),
[examiningInspector1] NVARCHAR(1000),
[examiningInspector2] NVARCHAR(1000),
[examiningInspector3] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
