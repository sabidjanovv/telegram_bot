/*
  Warnings:

  - The primary key for the `TelegramUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TelegramUser` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."TelegramUser_telegram_id_key";

-- AlterTable
ALTER TABLE "public"."TelegramUser" DROP CONSTRAINT "TelegramUser_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("telegram_id");
