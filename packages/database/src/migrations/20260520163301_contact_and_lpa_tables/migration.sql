/*
  Warnings:

  - You are about to drop the column `contactDetails` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `keyStageDates` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `lpa` on the `Case` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Case] DROP COLUMN [contactDetails],
[keyStageDates],
[lpa];
ALTER TABLE [dbo].[Case] ADD [gateway1Date] DATETIME2,
[gateway2Date] DATETIME2,
[gateway3Date] DATETIME2,
[intentionToCommenceDate] DATETIME2,
[submissionDate] DATETIME2;

-- CreateTable
CREATE TABLE [dbo].[LPA] (
    [lpaCode] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [LPA_pkey] PRIMARY KEY CLUSTERED ([lpaCode])
);

-- CreateTable
CREATE TABLE [dbo].[Contact] (
    [id] INT NOT NULL IDENTITY(1,1),
    [caseId] INT NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phoneNumber] NVARCHAR(1000) NOT NULL,
    [lpaCode] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Contact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[_CaseToLPA] (
    [A] INT NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_CaseToLPA_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateTable
CREATE TABLE [dbo].[_CaseToContact] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_CaseToContact_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_CaseToLPA_B_index] ON [dbo].[_CaseToLPA]([B]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_CaseToContact_B_index] ON [dbo].[_CaseToContact]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_lpaCode_fkey] FOREIGN KEY ([lpaCode]) REFERENCES [dbo].[LPA]([lpaCode]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToLPA] ADD CONSTRAINT [_CaseToLPA_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToLPA] ADD CONSTRAINT [_CaseToLPA_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[LPA]([lpaCode]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToContact] ADD CONSTRAINT [_CaseToContact_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Case]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_CaseToContact] ADD CONSTRAINT [_CaseToContact_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[Contact]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
