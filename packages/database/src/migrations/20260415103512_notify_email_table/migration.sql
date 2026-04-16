BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[NotifyEmail] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [notifyId] NVARCHAR(100) NOT NULL,
    [reference] NVARCHAR(1000),
    [createdDate] DATETIME2,
    [completedDate] DATETIME2,
    [status] NVARCHAR(100) NOT NULL,
    [templateId] NVARCHAR(100),
    [templateVersion] INT,
    [body] NVARCHAR(max),
    [subject] NVARCHAR(max),
    [email] NVARCHAR(100),
    CONSTRAINT [NotifyEmail_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
