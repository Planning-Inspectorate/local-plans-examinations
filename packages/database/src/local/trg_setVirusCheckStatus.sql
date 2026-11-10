CREATE OR ALTER TRIGGER [dbo].[trg_setVirusCheckStatus]
ON [dbo].[DocumentVersion]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dv
    SET dv.[virusCheckStatus] = 'scanned'
    FROM [dbo].[DocumentVersion] dv
    INNER JOIN inserted i
        ON dv.[documentGuid] = i.[documentGuid]
        AND dv.[version] = i.[version]
    WHERE dv.[virusCheckStatus] = 'not_scanned'
      AND i.[sourceSystem] = 'front-office'
      AND i.[isDeleted] = 0;
END;
GO
