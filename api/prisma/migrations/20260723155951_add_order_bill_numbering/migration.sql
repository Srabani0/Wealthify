-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "billNumber" INTEGER;

-- CreateTable
CREATE TABLE "bill_sequences" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_sequences_businessId_key" ON "bill_sequences"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_businessId_billNumber_key" ON "orders"("businessId", "billNumber");

-- AddForeignKey
ALTER TABLE "bill_sequences" ADD CONSTRAINT "bill_sequences_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
