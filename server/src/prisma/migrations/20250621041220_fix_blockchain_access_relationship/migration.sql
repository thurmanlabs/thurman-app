-- DropIndex
DROP INDEX "BlockchainAccess_walletId_key";

-- AlterTable
ALTER TABLE "BlockchainAccess" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "BlockchainAccess_pkey" PRIMARY KEY ("id");
