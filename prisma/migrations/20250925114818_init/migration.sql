-- CreateTable
CREATE TABLE "public"."walkOut" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "isDlt" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "walkOut_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."walkOut" ADD CONSTRAINT "walkOut_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
