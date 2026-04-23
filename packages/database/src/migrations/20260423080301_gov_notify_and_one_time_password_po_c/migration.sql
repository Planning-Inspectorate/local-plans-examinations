BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Case] (
    [id] INT NOT NULL IDENTITY(1,1),
    [reference] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Case_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Case_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Case_reference_key] UNIQUE NONCLUSTERED ([reference])
);

-- CreateTable
CREATE TABLE [dbo].[OneTimePassword] (
    [email] NVARCHAR(1000) NOT NULL,
    [hashedOtp] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OneTimePassword_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    [attempts] INT NOT NULL CONSTRAINT [OneTimePassword_attempts_df] DEFAULT 0,
    [locked_out_until] DATETIME2,
    CONSTRAINT [OneTimePassword_pkey] PRIMARY KEY CLUSTERED ([email])
);

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
