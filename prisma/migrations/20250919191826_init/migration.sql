-- CreateTable
CREATE TABLE "public"."UserSheet" (
    "id" SERIAL NOT NULL,
    "no" TEXT,
    "chat_id" TEXT NOT NULL,
    "karta_raqami" BOOLEAN NOT NULL,
    "amal_muddati" BOOLEAN NOT NULL,
    "status_code" INTEGER,
    "status_msg" TEXT,
    "phone" TEXT,
    "kod" BOOLEAN NOT NULL,
    "status_alt" TEXT,
    "vaqt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSheet_pkey" PRIMARY KEY ("id")
);
