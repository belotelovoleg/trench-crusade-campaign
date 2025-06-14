/*
  Warnings:

  - You are about to drop the column `is_admin` on the `players` table. All the data in the column will be lost.
  - Added the required column `campaign_id` to the `about_campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaign_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaign_id` to the `warbands` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
CREATE SEQUENCE about_campaign_id_seq;
ALTER TABLE "about_campaign" ADD COLUMN     "campaign_id" INTEGER NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('about_campaign_id_seq');
ALTER SEQUENCE about_campaign_id_seq OWNED BY "about_campaign"."id";

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "campaign_id" INTEGER NOT NULL,
ADD COLUMN     "player1_becomesElite" JSONB,
ADD COLUMN     "player2_becomesElite" JSONB;

-- AlterTable
ALTER TABLE "players" DROP COLUMN "is_admin",
ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "warbands" ADD COLUMN     "campaign_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_campaigns" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_campaigns_player_id_campaign_id_key" ON "players_campaigns"("player_id", "campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_id_about" ON "about_campaign"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_id" ON "games"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_id_warbands" ON "warbands"("campaign_id");

-- AddForeignKey
ALTER TABLE "players_campaigns" ADD CONSTRAINT "players_campaigns_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_campaigns" ADD CONSTRAINT "players_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warbands" ADD CONSTRAINT "warbands_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_campaign" ADD CONSTRAINT "about_campaign_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
