BEGIN TRY

BEGIN TRAN;

-- Create lookup tables
CREATE TABLE [dbo].[PlanType] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [PlanType_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[PlanBand] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [PlanBand_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[DsaChecked] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [DsaChecked_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[Gateway3Decision] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [Gateway3Decision_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[AuthorityStatus] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [AuthorityStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[DocumentSourceSystem] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [DocumentSourceSystem_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE TABLE [dbo].[VirusCheckStatus] (
    [id] NVARCHAR(50) NOT NULL,
    [displayName] NVARCHAR(100) NOT NULL,
    [displayOrder] INT NOT NULL,
    CONSTRAINT [VirusCheckStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- Seed the reference rows before validating existing data or enabling foreign keys.
INSERT INTO [dbo].[PlanType] ([id], [displayName], [displayOrder]) VALUES
    (N'local-plan', N'Local Plan', 1),
    (N'other', N'Other', 2);

INSERT INTO [dbo].[PlanBand] ([id], [displayName], [displayOrder]) VALUES
    (N'1', N'1', 1),
    (N'2', N'2', 2),
    (N'3', N'3', 3);

INSERT INTO [dbo].[DsaChecked] ([id], [displayName], [displayOrder]) VALUES
    (N'yes', N'Yes', 1),
    (N'no', N'No', 2);

INSERT INTO [dbo].[Gateway3Decision] ([id], [displayName], [displayOrder]) VALUES
    (N'1', N'Proceed to examination', 1),
    (N'2', N'Resubmission required', 2);

INSERT INTO [dbo].[AuthorityStatus] ([id], [displayName], [displayOrder]) VALUES
    (N'live', N'Live', 1),
    (N'invalid', N'Invalid', 2),
    (N'terminated', N'Terminated', 3),
    (N'unknown', N'Unknown', 4);

INSERT INTO [dbo].[DocumentSourceSystem] ([id], [displayName], [displayOrder]) VALUES
    (N'front-office', N'Front office', 1),
    (N'back-office', N'Back office', 2);

INSERT INTO [dbo].[VirusCheckStatus] ([id], [displayName], [displayOrder]) VALUES
    (N'affected', N'Affected', 1),
    (N'not_scanned', N'Not scanned', 2),
    (N'scanned', N'Scanned', 3);

-- Normalise recognised legacy representations to their canonical IDs.
UPDATE [dbo].[Case]
SET [planType] = CASE LOWER(LTRIM(RTRIM([planType])))
    WHEN N'local plan' THEN N'local-plan'
    WHEN N'local-plan' THEN N'local-plan'
    WHEN N'other' THEN N'other'
    ELSE [planType]
END;

UPDATE [dbo].[Case]
SET [planBand] = LTRIM(RTRIM([planBand]))
WHERE [planBand] IS NOT NULL
AND LTRIM(RTRIM([planBand])) IN (N'1', N'2', N'3');

UPDATE [dbo].[Gateway1Info]
SET [dsaChecked] = LOWER(LTRIM(RTRIM([dsaChecked])))
WHERE [dsaChecked] IS NOT NULL
AND LOWER(LTRIM(RTRIM([dsaChecked]))) IN (N'yes', N'no');

UPDATE [dbo].[Gateway3Info]
SET [decision] = LTRIM(RTRIM([decision]))
WHERE [decision] IS NOT NULL
AND LTRIM(RTRIM([decision])) IN (N'1', N'2');

UPDATE [dbo].[Authority]
SET [status] = LOWER(LTRIM(RTRIM([status])))
WHERE LOWER(LTRIM(RTRIM([status]))) IN (N'live', N'invalid', N'terminated', N'unknown');

UPDATE [dbo].[DocumentVersion]
SET [sourceSystem] = LOWER(LTRIM(RTRIM([sourceSystem])))
WHERE LOWER(LTRIM(RTRIM([sourceSystem]))) IN (N'front-office', N'back-office');

UPDATE [dbo].[DocumentVersion]
SET [virusCheckStatus] = LOWER(LTRIM(RTRIM([virusCheckStatus])))
WHERE LOWER(LTRIM(RTRIM([virusCheckStatus]))) IN (N'affected', N'not_scanned', N'scanned');

-- Abort rather than accepting an undocumented value into a reference table.
IF EXISTS (
    SELECT 1
    FROM [dbo].[Case] AS [case]
    LEFT JOIN [dbo].[PlanType] AS [lookup] ON [case].[planType] = [lookup].[id]
    WHERE [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Case.planType contains values that are not present in PlanType.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Case] AS [case]
    LEFT JOIN [dbo].[PlanBand] AS [lookup] ON [case].[planBand] = [lookup].[id]
    WHERE [case].[planBand] IS NOT NULL AND [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Case.planBand contains values that are not present in PlanBand.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway1Info] AS [gateway1Info]
    LEFT JOIN [dbo].[DsaChecked] AS [lookup] ON [gateway1Info].[dsaChecked] = [lookup].[id]
    WHERE [gateway1Info].[dsaChecked] IS NOT NULL AND [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway1Info.dsaChecked contains values that are not present in DsaChecked.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Gateway3Info] AS [gateway3Info]
    LEFT JOIN [dbo].[Gateway3Decision] AS [lookup] ON [gateway3Info].[decision] = [lookup].[id]
    WHERE [gateway3Info].[decision] IS NOT NULL AND [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Gateway3Info.decision contains values that are not present in Gateway3Decision.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[Authority] AS [authority]
    LEFT JOIN [dbo].[AuthorityStatus] AS [lookup] ON [authority].[status] = [lookup].[id]
    WHERE [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'Authority.status contains values that are not present in AuthorityStatus.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[DocumentVersion] AS [documentVersion]
    LEFT JOIN [dbo].[DocumentSourceSystem] AS [lookup] ON [documentVersion].[sourceSystem] = [lookup].[id]
    WHERE [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'DocumentVersion.sourceSystem contains values that are not present in DocumentSourceSystem.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM [dbo].[DocumentVersion] AS [documentVersion]
    LEFT JOIN [dbo].[VirusCheckStatus] AS [lookup] ON [documentVersion].[virusCheckStatus] = [lookup].[id]
    WHERE [lookup].[id] IS NULL
)
BEGIN
    THROW 51000, 'DocumentVersion.virusCheckStatus contains values that are not present in VirusCheckStatus.', 1;
END;

-- Alter tables readd NOT NULL constraint
ALTER TABLE [dbo].[Authority] ALTER COLUMN [status] NVARCHAR(50) NOT NULL;

ALTER TABLE [dbo].[Case] ALTER COLUMN [planType] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Case] ALTER COLUMN [planBand] NVARCHAR(50) NULL;

ALTER TABLE [dbo].[DocumentVersion] ALTER COLUMN [sourceSystem] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[DocumentVersion] ALTER COLUMN [virusCheckStatus] NVARCHAR(50) NOT NULL;

ALTER TABLE [dbo].[Gateway1Info] ALTER COLUMN [dsaChecked] NVARCHAR(50) NULL;

ALTER TABLE [dbo].[Gateway3Info] ALTER COLUMN [decision] NVARCHAR(50) NULL;

-- Create indexes we require on lookup fields
CREATE NONCLUSTERED INDEX [Authority_status_idx] ON [dbo].[Authority]([status]);

CREATE NONCLUSTERED INDEX [Case_planType_idx] ON [dbo].[Case]([planType]);

CREATE NONCLUSTERED INDEX [Case_planBand_idx] ON [dbo].[Case]([planBand]);

CREATE NONCLUSTERED INDEX [DocumentVersion_sourceSystem_idx] ON [dbo].[DocumentVersion]([sourceSystem]);

CREATE NONCLUSTERED INDEX [DocumentVersion_virusCheckStatus_idx] ON [dbo].[DocumentVersion]([virusCheckStatus]);

CREATE NONCLUSTERED INDEX [Gateway1Info_dsaChecked_idx] ON [dbo].[Gateway1Info]([dsaChecked]);

CREATE NONCLUSTERED INDEX [Gateway3Info_decision_idx] ON [dbo].[Gateway3Info]([decision]);

-- AddF foreign keys on look tables
ALTER TABLE [dbo].[Case] WITH CHECK ADD CONSTRAINT [Case_planType_fkey] FOREIGN KEY ([planType]) REFERENCES [dbo].[PlanType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Case] CHECK CONSTRAINT [Case_planType_fkey];

ALTER TABLE [dbo].[Case] WITH CHECK ADD CONSTRAINT [Case_planBand_fkey] FOREIGN KEY ([planBand]) REFERENCES [dbo].[PlanBand]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Case] CHECK CONSTRAINT [Case_planBand_fkey];

ALTER TABLE [dbo].[Gateway1Info] WITH CHECK ADD CONSTRAINT [Gateway1Info_dsaChecked_fkey] FOREIGN KEY ([dsaChecked]) REFERENCES [dbo].[DsaChecked]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Gateway1Info] CHECK CONSTRAINT [Gateway1Info_dsaChecked_fkey];

ALTER TABLE [dbo].[Gateway3Info] WITH CHECK ADD CONSTRAINT [Gateway3Info_decision_fkey] FOREIGN KEY ([decision]) REFERENCES [dbo].[Gateway3Decision]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Gateway3Info] CHECK CONSTRAINT [Gateway3Info_decision_fkey];

ALTER TABLE [dbo].[Authority] WITH CHECK ADD CONSTRAINT [Authority_status_fkey] FOREIGN KEY ([status]) REFERENCES [dbo].[AuthorityStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Authority] CHECK CONSTRAINT [Authority_status_fkey];

ALTER TABLE [dbo].[DocumentVersion] WITH CHECK ADD CONSTRAINT [DocumentVersion_sourceSystem_fkey] FOREIGN KEY ([sourceSystem]) REFERENCES [dbo].[DocumentSourceSystem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DocumentVersion] CHECK CONSTRAINT [DocumentVersion_sourceSystem_fkey];

ALTER TABLE [dbo].[DocumentVersion] WITH CHECK ADD CONSTRAINT [DocumentVersion_virusCheckStatus_fkey] FOREIGN KEY ([virusCheckStatus]) REFERENCES [dbo].[VirusCheckStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[DocumentVersion] CHECK CONSTRAINT [DocumentVersion_virusCheckStatus_fkey];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
