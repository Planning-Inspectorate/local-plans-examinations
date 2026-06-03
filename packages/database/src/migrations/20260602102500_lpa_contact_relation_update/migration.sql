/*
  Warnings:

  - You are about to alter the column `A` on the `_CaseToContact` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - You are about to alter the column `B` on the `_CaseToContact` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - The primary key for the `Case` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Case` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - The primary key for the `Contact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `caseId` on the `Contact` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `Contact` table. The data in that column could be lost. The data in that column will be cast from `String` to `String`.
  - You are about to alter the column `firstName` on the `Contact` table. The data in that column could be lost. The data in that column will be cast from `String` to `String`.
  - You are about to alter the column `id` on the `Contact` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - You are about to alter the column `lastName` on the `Contact` table. The data in that column could be lost. The data in that column will be cast from `String` to `String`.
  - You are about to alter the column `phoneNumber` on the `Contact` table. The data in that column could be lost. The data in that column will be cast from `String` to `String`.
  - Changed the type of `A` on the `_CaseToLPA` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[_CaseToLPA] DROP CONSTRAINT [_CaseToLPA_A_fkey];

-- DropIndex
ALTER TABLE [dbo].[_CaseToLPA] DROP CONSTRAINT [_CaseToLPA_AB_unique];

-- AlterTable
ALTER TABLE [dbo].[_CaseToLPA] DROP COLUMN [A];
ALTER TABLE [dbo].[_CaseToLPA] ADD [A] UNIQUEIDENTIFIER NOT NULL;

-- RedefineTables
BEGIN TRANSACTION;
ALTER TABLE [dbo].[_CaseToContact] DROP CONSTRAINT [_CaseToContact_AB_unique];
DROP INDEX [_CaseToContact_B_index] ON [dbo].[_CaseToContact];
DECLARE @SQL NVARCHAR(MAX);
SET @SQL = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = '_CaseToContact'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new__CaseToContact] (
    [A] UNIQUEIDENTIFIER NOT NULL,
    [B] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [_CaseToContact_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);
IF EXISTS(SELECT * FROM [dbo].[_CaseToContact])
    EXEC('INSERT INTO [dbo].[_prisma_new__CaseToContact] ([A],[B]) SELECT [A],[B] FROM [dbo].[_CaseToContact] WITH (holdlock tablockx)');
DROP TABLE [dbo].[_CaseToContact];
EXEC SP_RENAME N'dbo._prisma_new__CaseToContact', N'_CaseToContact';
CREATE NONCLUSTERED INDEX [_CaseToContact_B_index] ON [dbo].[_CaseToContact]([B]);
ALTER TABLE [dbo].[Case] DROP CONSTRAINT [Case_reference_key];
SET @SQL = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'Case'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_Case] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [reference] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [caseOfficer] NVARCHAR(1000) NOT NULL,
    [planTitle] NVARCHAR(1000) NOT NULL,
    [planType] NVARCHAR(1000) NOT NULL,
    [intentionToCommenceDate] DATETIME2,
    [gateway1Date] DATETIME2,
    [gateway2Date] DATETIME2,
    [gateway3Date] DATETIME2,
    [submissionDate] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Case_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Case_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Case_reference_key] UNIQUE NONCLUSTERED ([reference])
);
IF EXISTS(SELECT * FROM [dbo].[Case])
    EXEC('INSERT INTO [dbo].[_prisma_new_Case] ([caseOfficer],[createdAt],[email],[gateway1Date],[gateway2Date],[gateway3Date],[id],[intentionToCommenceDate],[planTitle],[planType],[reference],[submissionDate]) SELECT [caseOfficer],[createdAt],[email],[gateway1Date],[gateway2Date],[gateway3Date],[id],[intentionToCommenceDate],[planTitle],[planType],[reference],[submissionDate] FROM [dbo].[Case] WITH (holdlock tablockx)');
DROP TABLE [dbo].[Case];
EXEC SP_RENAME N'dbo._prisma_new_Case', N'Case';
SET @SQL = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'Contact'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_Contact] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [firstName] NVARCHAR(100) NOT NULL,
    [lastName] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [phoneNumber] NVARCHAR(30) NOT NULL,
    [lpaCode] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Contact_pkey] PRIMARY KEY CLUSTERED ([id])
);
IF EXISTS(SELECT * FROM [dbo].[Contact])
    EXEC('INSERT INTO [dbo].[_prisma_new_Contact] ([email],[firstName],[id],[lastName],[lpaCode],[phoneNumber]) SELECT [email],[firstName],[id],[lastName],[lpaCode],[phoneNumber] FROM [dbo].[Contact] WITH (holdlock tablockx)');
DROP TABLE [dbo].[Contact];
EXEC SP_RENAME N'dbo._prisma_new_Contact', N'Contact';
COMMIT;

-- CreateIndex
ALTER TABLE [dbo].[_CaseToLPA] ADD CONSTRAINT [_CaseToLPA_AB_unique] UNIQUE NONCLUSTERED ([A], [B]);

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToLPA] ADD CONSTRAINT [_CaseToLPA_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
