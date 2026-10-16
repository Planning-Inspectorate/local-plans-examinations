/*
  Warnings:

  - You are about to drop the column `workshopVenue` on the `Gateway2Info` table. All the data in the column will be lost.
  - You are about to drop the column `workshopComplete` on the `Gateway2Workshop` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN [workshopVenue];

-- AlterTable
ALTER TABLE [dbo].[Gateway2Workshop] DROP CONSTRAINT [Gateway2Workshop_workshopComplete_df];

ALTER TABLE [dbo].[Gateway2Workshop] DROP COLUMN [workshopComplete];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
