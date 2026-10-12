BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Gateway3SubmissionDocument] (
    [gateway3InfoId] UNIQUEIDENTIFIER NOT NULL,
    [submissionNumber] INT NOT NULL,
    [documentGuid] UNIQUEIDENTIFIER NOT NULL,
    [version] INT NOT NULL,
    [documentSetId] NVARCHAR(20) NOT NULL,
    [submittedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Gateway3SubmissionDocument_pkey] PRIMARY KEY CLUSTERED ([gateway3InfoId],[submissionNumber],[documentGuid])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gateway3SubmissionDocument_gateway3InfoId_submissionNumber_idx] ON [dbo].[Gateway3SubmissionDocument]([gateway3InfoId], [submissionNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gateway3SubmissionDocument_documentGuid_version_idx] ON [dbo].[Gateway3SubmissionDocument]([documentGuid], [version]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gateway3SubmissionDocument_documentSetId_idx] ON [dbo].[Gateway3SubmissionDocument]([documentSetId]);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3SubmissionDocument] ADD CONSTRAINT [Gateway3SubmissionDocument_gateway3InfoId_fkey] FOREIGN KEY ([gateway3InfoId]) REFERENCES [dbo].[Gateway3Info]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3SubmissionDocument] ADD CONSTRAINT [Gateway3SubmissionDocument_documentGuid_version_fkey] FOREIGN KEY ([documentGuid],[version]) REFERENCES [dbo].[DocumentVersion]([documentGuid],[version]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3SubmissionDocument] ADD CONSTRAINT [Gateway3SubmissionDocument_documentSetId_fkey] FOREIGN KEY ([documentSetId]) REFERENCES [dbo].[DocumentSet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
