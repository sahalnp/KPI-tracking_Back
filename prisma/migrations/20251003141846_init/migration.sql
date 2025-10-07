-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "active_flag" SET DEFAULT false,
ALTER COLUMN "pin_hash" SET DEFAULT '';

-- CreateTable
CREATE TABLE "public"."Upload" (
    "id" SERIAL NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy_id" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sales_id" TEXT,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_uploadedBy_id_fkey" FOREIGN KEY ("uploadedBy_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."Sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
