BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Gateway3Info] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [estimatedDate] DATETIME2,
    CONSTRAINT [Gateway3Info_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Gateway3Info_caseId_key] UNIQUE NONCLUSTERED ([caseId])
);

-- CreateTable
CREATE TABLE [dbo].[ExaminationInfo] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [submissionForExaminationDate] DATETIME2,
    CONSTRAINT [ExaminationInfo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ExaminationInfo_caseId_key] UNIQUE NONCLUSTERED ([caseId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Gateway3Info] ADD CONSTRAINT [Gateway3Info_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([reference]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ExaminationInfo] ADD CONSTRAINT [ExaminationInfo_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[Case]([reference]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
