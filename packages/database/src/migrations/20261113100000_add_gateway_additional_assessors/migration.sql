BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Gateway2Assessor] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [gateway2InfoId] UNIQUEIDENTIFIER NOT NULL,
    [assessorName] NVARCHAR(1000) NOT NULL,
    [assessorAppointmentDate] DATETIME2 NOT NULL,
    [createdDate] DATETIME2 NOT NULL CONSTRAINT [Gateway2Assessor_createdDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Gateway2Assessor_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Gateway3Assessor] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [gateway3InfoId] UNIQUEIDENTIFIER NOT NULL,
    [assessorName] NVARCHAR(1000) NOT NULL,
    [assessorAppointmentDate] DATETIME2 NOT NULL,
    [createdDate] DATETIME2 NOT NULL CONSTRAINT [Gateway3Assessor_createdDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Gateway3Assessor_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gateway2Assessor_gateway2InfoId_idx] ON [dbo].[Gateway2Assessor]([gateway2InfoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Gateway3Assessor_gateway3InfoId_idx] ON [dbo].[Gateway3Assessor]([gateway3InfoId]);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway2Assessor] ADD CONSTRAINT [Gateway2Assessor_gateway2InfoId_fkey] FOREIGN KEY ([gateway2InfoId]) REFERENCES [dbo].[Gateway2Info]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Assessor] ADD CONSTRAINT [Gateway3Assessor_gateway3InfoId_fkey] FOREIGN KEY ([gateway3InfoId]) REFERENCES [dbo].[Gateway3Info]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
