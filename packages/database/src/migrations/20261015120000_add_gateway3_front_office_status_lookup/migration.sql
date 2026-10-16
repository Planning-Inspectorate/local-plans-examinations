BEGIN TRY

BEGIN TRAN;

-- Create lookup table
CREATE TABLE [dbo].[Gateway3FrontOfficeStatus] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    CONSTRAINT [Gateway3FrontOfficeStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- Seed the reference rows before validating existing data or enabling the foreign key.
INSERT INTO [dbo].[Gateway3FrontOfficeStatus] ([id], [displayName]) VALUES
    (N'CANNOT_START_YET', N'Cannot start yet'),
    (N'READY_TO_START', N'Ready to start'),
    (N'IN_PROGRESS', N'In progress'),
    (N'UNDER_REVIEW', N'Under review'),
    (N'RESUBMISSION_REQUIRED', N'Resubmission required'),
    (N'COMPLETED', N'Completed');

-- Abort rather than accepting an undocumented value into the reference relationship.
IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway3Info] AS [gateway3Info]
    LEFT JOIN [dbo].[Gateway3FrontOfficeStatus] AS [lookup] ON [gateway3Info].[frontOfficeStatus] = [lookup].[id]
    WHERE [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway3Info.frontOfficeStatus contains values that are not present in Gateway3FrontOfficeStatus.', 1;
END;

-- Create index we require on the lookup field
CREATE NONCLUSTERED INDEX [Gateway3Info_frontOfficeStatus_idx] ON [dbo].[Gateway3Info]([frontOfficeStatus]);

-- Add foreign key on lookup table
ALTER TABLE [dbo].[Gateway3Info] WITH CHECK ADD CONSTRAINT [Gateway3Info_frontOfficeStatus_fkey] FOREIGN KEY ([frontOfficeStatus]) REFERENCES [dbo].[Gateway3FrontOfficeStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Gateway3Info] CHECK CONSTRAINT [Gateway3Info_frontOfficeStatus_fkey];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

