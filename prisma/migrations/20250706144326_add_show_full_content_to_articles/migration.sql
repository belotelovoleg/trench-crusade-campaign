-- AlterTable
ALTER TABLE "about_campaign" ADD COLUMN     "showFullContent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "title" SET DEFAULT 'Без назви';
