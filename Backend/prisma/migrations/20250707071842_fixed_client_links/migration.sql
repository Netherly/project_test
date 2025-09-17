/*
  Warnings:

  - You are about to drop the column `client_name` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `short_description` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "client_name",
DROP COLUMN "notes",
DROP COLUMN "short_description",
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "intro_description" TEXT,
ADD COLUMN     "manager_name" TEXT,
ADD COLUMN     "name" VARCHAR(255),
ADD COLUMN     "note" TEXT;
