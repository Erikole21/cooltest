-- AlterTable
ALTER TABLE "products" ADD COLUMN     "reserved_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "reserved_until" TIMESTAMP(3),
ADD COLUMN     "stock_committed_at" TIMESTAMP(3),
ADD COLUMN     "stock_released_at" TIMESTAMP(3);
