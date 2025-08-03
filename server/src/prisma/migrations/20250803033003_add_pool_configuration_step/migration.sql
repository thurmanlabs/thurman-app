-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LoanPoolStatus" ADD VALUE 'CONFIGURING_POOL';
ALTER TYPE "LoanPoolStatus" ADD VALUE 'POOL_CONFIGURED';

-- AlterTable
ALTER TABLE "LoanPool" ADD COLUMN     "pool_config_tx_hash" TEXT,
ADD COLUMN     "pool_config_tx_id" TEXT;
