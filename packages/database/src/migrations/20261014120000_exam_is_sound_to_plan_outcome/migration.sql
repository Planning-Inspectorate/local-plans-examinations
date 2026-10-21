BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ExaminationInfo] ALTER COLUMN [isSound] NVARCHAR(50) NULL;

-- Convert the previous Sound (1) / Unsound (0) values
EXEC('UPDATE [dbo].[ExaminationInfo] SET [isSound] = CASE [isSound] WHEN ''1'' THEN ''sound'' WHEN ''0'' THEN ''unsound'' ELSE [isSound] END');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
