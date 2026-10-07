BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[CaseNote] (
    [text] NVARCHAR(500) NOT NULL,
    [createdTime] DATETIME2 NOT NULL,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [caseId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [CaseNote_pkey] PRIMARY KEY CLUSTERED ([text],[createdTime],[createdBy],[caseId])
);

-- AddForeignKey
ALTER TABLE [dbo].[CaseNote] ADD CONSTRAINT [CaseNote_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
