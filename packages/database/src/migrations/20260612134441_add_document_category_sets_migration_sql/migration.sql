BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Gateway] (
    [id] NVARCHAR(2) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [folderName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [Gateway_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentCategory] (
    [id] NVARCHAR(4) NOT NULL,
    [gatewayId] NVARCHAR(2) NOT NULL,
    [displayName] NVARCHAR(200) NOT NULL,
    [folderName] NVARCHAR(200) NOT NULL,
    [displayOrder] INT,
    CONSTRAINT [DocumentCategory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DocumentCategory_gatewayId_displayName_key] UNIQUE NONCLUSTERED ([gatewayId],[displayName])
);

-- CreateTable
CREATE TABLE [dbo].[DocumentSet] (
    [id] NVARCHAR(20) NOT NULL,
    [gatewayId] NVARCHAR(2) NOT NULL,
    [documentCategoryId] NVARCHAR(4) NOT NULL,
    [displayName] NVARCHAR(200) NOT NULL,
    [folderName] NVARCHAR(200) NOT NULL,
    [displayOrder] INT,
    CONSTRAINT [DocumentSet_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DocumentSet_documentCategoryId_displayName_key] UNIQUE NONCLUSTERED ([documentCategoryId],[displayName])
);

-- CreateTable
CREATE TABLE [dbo].[_CaseToGateway] (
    [A] UNIQUEIDENTIFIER NOT NULL,
    [B] NVARCHAR(2) NOT NULL,
    CONSTRAINT [_CaseToGateway_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentCategory_gatewayId_idx] ON [dbo].[DocumentCategory]([gatewayId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DocumentSet_documentCategoryId_idx] ON [dbo].[DocumentSet]([documentCategoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_CaseToGateway_B_index] ON [dbo].[_CaseToGateway]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[DocumentCategory] ADD CONSTRAINT [DocumentCategory_gatewayId_fkey] FOREIGN KEY ([gatewayId]) REFERENCES [dbo].[Gateway]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentSet] ADD CONSTRAINT [DocumentSet_gatewayId_fkey] FOREIGN KEY ([gatewayId]) REFERENCES [dbo].[Gateway]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DocumentSet] ADD CONSTRAINT [DocumentSet_documentCategoryId_fkey] FOREIGN KEY ([documentCategoryId]) REFERENCES [dbo].[DocumentCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToGateway] ADD CONSTRAINT [_CaseToGateway_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToGateway] ADD CONSTRAINT [_CaseToGateway_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[Gateway]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
