-- CreateEnum
CREATE TYPE "games_status" AS ENUM ('planned', 'active', 'pending_approval', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "WarbandStatus" AS ENUM ('active', 'checking', 'needs_update', 'deleted');

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "warband_1_id" INTEGER NOT NULL,
    "warband_2_id" INTEGER NOT NULL,
    "status" "games_status" NOT NULL DEFAULT 'planned',
    "vp_1" INTEGER DEFAULT 0,
    "vp_2" INTEGER DEFAULT 0,
    "gp_1" INTEGER DEFAULT 0,
    "gp_2" INTEGER DEFAULT 0,
    "idt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "udt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "warband_1_gameNumber" INTEGER,
    "warband_2_gameNumber" INTEGER,
    "warband_1_roster_id" INTEGER,
    "warband_2_roster_id" INTEGER,
    "player1_isReady" BOOLEAN NOT NULL DEFAULT false,
    "player2_isReady" BOOLEAN NOT NULL DEFAULT false,
    "player1_id" INTEGER,
    "player2_id" INTEGER,
    "player1_isApprovedResult" BOOLEAN NOT NULL DEFAULT false,
    "player2_isApprovedResult" BOOLEAN NOT NULL DEFAULT false,
    "player1_calledReinforcements" BOOLEAN NOT NULL DEFAULT false,
    "player2_calledReinforcements" BOOLEAN NOT NULL DEFAULT false,
    "player1_injuries" JSONB,
    "player2_injuries" JSONB,
    "player1_skillAdvancements" JSONB,
    "player2_skillAdvancements" JSONB,
    "player1_explorationDice" INTEGER,
    "player2_explorationDice" INTEGER,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatar_url" TEXT,
    "avatar" TEXT,
    "notes" TEXT,
    "is_admin" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "idt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "udt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ldt" TIMESTAMP(3),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosters" (
    "id" SERIAL NOT NULL,
    "warband_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "file_content" TEXT,
    "description" TEXT,
    "uploaded_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ducats" INTEGER DEFAULT 0,
    "model_count" INTEGER DEFAULT 0,
    "glory_points" INTEGER DEFAULT 0,
    "game_number" INTEGER,

    CONSTRAINT "rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" SERIAL NOT NULL,
    "warband_id" INTEGER NOT NULL,
    "game_id" INTEGER,
    "text" TEXT,
    "posted_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warbands" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "name" TEXT,
    "games_count" INTEGER DEFAULT 0,
    "victory_points" INTEGER DEFAULT 0,
    "idt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "udt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "catalogue_name" TEXT,
    "status" "WarbandStatus" NOT NULL DEFAULT 'checking',

    CONSTRAINT "warbands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_campaign" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warband_1_id" ON "games"("warband_1_id");

-- CreateIndex
CREATE INDEX "warband_2_id" ON "games"("warband_2_id");

-- CreateIndex
CREATE INDEX "idx_player1_id" ON "games"("player1_id");

-- CreateIndex
CREATE INDEX "idx_player2_id" ON "games"("player2_id");

-- CreateIndex
CREATE UNIQUE INDEX "login" ON "players"("login");

-- CreateIndex
CREATE UNIQUE INDEX "email" ON "players"("email");

-- CreateIndex
CREATE INDEX "rosters_warband_id" ON "rosters"("warband_id");

-- CreateIndex
CREATE INDEX "stories_warband_id" ON "stories"("warband_id");

-- CreateIndex
CREATE INDEX "player_id" ON "warbands"("player_id");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_ibfk_1" FOREIGN KEY ("warband_1_id") REFERENCES "warbands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_ibfk_2" FOREIGN KEY ("warband_2_id") REFERENCES "warbands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_ibfk_1" FOREIGN KEY ("warband_id") REFERENCES "warbands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_ibfk_1" FOREIGN KEY ("warband_id") REFERENCES "warbands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "warbands" ADD CONSTRAINT "warbands_ibfk_1" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
