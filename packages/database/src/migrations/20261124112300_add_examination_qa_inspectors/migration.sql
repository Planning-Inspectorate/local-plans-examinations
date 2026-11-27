BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[QaInspector] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [examinationInfoId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [appointmentDate] DATETIME2 NOT NULL,
    [createdDate] DATETIME2 NOT NULL CONSTRAINT [QaInspector_createdDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QaInspector_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QaInspector_examinationInfoId_idx] ON [dbo].[QaInspector]([examinationInfoId]);

-- AddForeignKey
ALTER TABLE [dbo].[QaInspector] ADD CONSTRAINT [QaInspector_examinationInfoId_fkey] FOREIGN KEY ([examinationInfoId]) REFERENCES [dbo].[ExaminationInfo]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
