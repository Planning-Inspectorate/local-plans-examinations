BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[OneTimePassword] (
    [email] NVARCHAR(1000) NOT NULL,
    [caseReference] NVARCHAR(1000) NOT NULL,
    [hashedOtpCode] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OneTimePassword_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    [attempts] INT NOT NULL CONSTRAINT [OneTimePassword_attempts_df] DEFAULT 0,
    CONSTRAINT [OneTimePassword_pkey] PRIMARY KEY CLUSTERED ([email],[caseReference])
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
