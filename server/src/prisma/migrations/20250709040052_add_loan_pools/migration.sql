-- CreateEnum
CREATE TYPE "LoanPoolStatus" AS ENUM ('PENDING', 'APPROVED', 'DEPLOYING_POOL', 'POOL_CREATED', 'DEPLOYING_LOANS', 'DEPLOYED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "LoanPool" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "target_amount" DECIMAL(18,2),
    "minimum_investment" DECIMAL(18,2),
    "expected_return" DECIMAL(5,4),
    "maturity_date" TIMESTAMP(3),
    "purpose" TEXT,
    "geographic_focus" TEXT,
    "borrower_profile" TEXT,
    "collateral_type" TEXT,
    "loan_term_range" TEXT,
    "interest_rate_range" TEXT,
    "loan_data" TEXT NOT NULL,
    "total_loans" INTEGER NOT NULL,
    "total_principal" DECIMAL(18,2) NOT NULL,
    "avg_interest_rate" DECIMAL(5,4) NOT NULL,
    "avg_term_months" INTEGER NOT NULL,
    "original_filename" TEXT NOT NULL,
    "status" "LoanPoolStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "pool_creation_tx_id" TEXT,
    "loans_creation_tx_id" TEXT,
    "pool_creation_tx_hash" TEXT,
    "loans_creation_tx_hash" TEXT,
    "deployed_by_wallet_id" TEXT,
    "pool_id" INTEGER,
    "vault_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanPool_pool_id_key" ON "LoanPool"("pool_id");

-- AddForeignKey
ALTER TABLE "LoanPool" ADD CONSTRAINT "LoanPool_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPool" ADD CONSTRAINT "LoanPool_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
