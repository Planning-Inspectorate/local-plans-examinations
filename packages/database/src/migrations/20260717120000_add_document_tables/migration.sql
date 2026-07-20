BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Document] (
    [guid] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [caseId] UNIQUEIDENTIFIER NOT NULL,
    [documentSetId] NVARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Document_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isDeleted] BIT NOT NULL CONSTRAINT [Document_isDeleted_df] DEFAULT 0,
    [latestVersionId] INT,
    CONSTRAINT [Document_pkey] PRIMARY KEY CLUSTERED ([guid]),
    CONSTRAINT [Document_name_documentSetId_key] UNIQUE NONCLUSTERED ([name],[documentSetId]),
    CONSTRAINT [Document_guid_latestVersionId_key] UNIQUE NONCLUSTERED ([guid],[latestVersionId])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentVersion] (
    [documentGuid] UNIQUEIDENTIFIER NOT NULL,
    [version] INT NOT NULL,
    [lastModified] DATETIME2,
    [sourceSystem] NVARCHAR(1000) NOT NULL CONSTRAINT [DocumentVersion_sourceSystem_df] DEFAULT 'front-office',
    [virusCheckStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [DocumentVersion_virusCheckStatus_df] DEFAULT 'not_scanned',
    [originalFilename] NVARCHAR(1000),
    [fileName] NVARCHAR(1000),
    [owner] NVARCHAR(1000),
    [mime] NVARCHAR(1000),
    [size] INT,
    [blobStorageContainer] NVARCHAR(1000),
    [blobStoragePath] NVARCHAR(1000),
    [documentURI] NVARCHAR(1000),
    [dateCreated] DATETIME2 CONSTRAINT [DocumentVersion_dateCreated_df] DEFAULT CURRENT_TIMESTAMP,
    [isDeleted] BIT NOT NULL CONSTRAINT [DocumentVersion_isDeleted_df] DEFAULT 0,
    CONSTRAINT [DocumentVersion_pkey] PRIMARY KEY CLUSTERED ([documentGuid],[version])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentVersionAvScan] (
    [documentGuid] UNIQUEIDENTIFIER NOT NULL,
    [version] INT NOT NULL,
    [avScanSuccess] BIT NOT NULL,
    [avScanDate] DATETIME2 NOT NULL CONSTRAINT [DocumentVersionAvScan_avScanDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DocumentVersionAvScan_pkey] PRIMARY KEY CLUSTERED ([documentGuid],[version])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Document_caseId_documentSetId_idx] ON [dbo].[Document]([caseId],[documentSetId]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [Document_one_active_per_case_documentSet_idx] ON [dbo].[Document]([caseId],[documentSetId]) WHERE [isDeleted] = 0;

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentGuid] ON [dbo].[DocumentVersion]([documentGuid]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentVersion_documentURI_idx] ON [dbo].[DocumentVersion]([documentURI]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentGuid] ON [dbo].[DocumentVersionAvScan]([documentGuid]);

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_documentSetId_fkey] FOREIGN KEY ([documentSetId]) REFERENCES [dbo].[DocumentSet]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Document] ADD CONSTRAINT [Document_guid_latestVersionId_fkey] FOREIGN KEY ([guid],[latestVersionId]) REFERENCES [dbo].[DocumentVersion]([documentGuid],[version]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentVersion] ADD CONSTRAINT [DocumentVersion_documentGuid_fkey] FOREIGN KEY ([documentGuid]) REFERENCES [dbo].[Document]([guid]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentVersionAvScan] ADD CONSTRAINT [DocumentVersionAvScan_documentGuid_version_fkey] FOREIGN KEY ([documentGuid],[version]) REFERENCES [dbo].[DocumentVersion]([documentGuid],[version]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
