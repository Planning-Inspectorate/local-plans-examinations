/*
  Warnings:

  - You are about to drop the column `qaInspector1` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `qaInspector2` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `qaInspector3` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [qaInspector1],
[qaInspector2],
[qaInspector3];

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ADD [QADate] DATETIME2,
[panelResponseToInspectorDate] DATETIME2,
[qaInspector1] NVARCHAR(1000),
[qaInspector2] NVARCHAR(1000),
[qaInspector3] NVARCHAR(1000),
[reportSentToPanelDate] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
