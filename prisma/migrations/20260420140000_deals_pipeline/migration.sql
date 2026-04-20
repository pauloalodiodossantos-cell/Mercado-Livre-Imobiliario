-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DdCaseStatus" AS ENUM ('PENDING', 'RUNNING', 'APPROVED', 'FLAGGED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT_FOR_SIGNATURE', 'SIGNED', 'VOIDED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING_FUNDING', 'FUNDED', 'RELEASED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ValuationSnapshot" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'mvp-1',
    "estimatedRentMonthly" DECIMAL(14,2),
    "annualRentEstimate" DECIMAL(14,2) NOT NULL,
    "capRatePct" DECIMAL(10,4) NOT NULL,
    "irrEstimatePct" DECIMAL(10,4) NOT NULL,
    "regionalPriceCeiling" DECIMAL(14,2) NOT NULL,
    "discountVsCeilingPct" DECIMAL(10,4) NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL,
    "inputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "offerPrice" DECIMAL(14,2) NOT NULL,
    "earnestMoney" DECIMAL(14,2) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'SUBMITTED',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDiligenceCase" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "DdCaseStatus" NOT NULL DEFAULT 'APPROVED',
    "riskScore" INTEGER NOT NULL DEFAULT 12,
    "summary" TEXT NOT NULL DEFAULT 'Stub: certidoes e matricula simuladas via integracao futura.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DueDiligenceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdCheck" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resultSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DdCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "bodyMarkdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowAccount" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING_FUNDING',
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "fundedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL DEFAULT 'baas_stub',
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowMilestone" (
    "id" TEXT NOT NULL,
    "escrowAccountId" TEXT NOT NULL,
    "milestoneType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValuationSnapshot_listingId_key" ON "ValuationSnapshot"("listingId");

-- CreateIndex
CREATE INDEX "Offer_listingId_idx" ON "Offer"("listingId");

-- CreateIndex
CREATE INDEX "Offer_buyerUserId_idx" ON "Offer"("buyerUserId");

-- CreateIndex
CREATE INDEX "DdCheck_caseId_idx" ON "DdCheck"("caseId");

-- CreateIndex
CREATE INDEX "EscrowMilestone_escrowAccountId_idx" ON "EscrowMilestone"("escrowAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "DueDiligenceCase_offerId_key" ON "DueDiligenceCase"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_offerId_key" ON "Contract"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAccount_offerId_key" ON "EscrowAccount"("offerId");

-- AddForeignKey
ALTER TABLE "ValuationSnapshot" ADD CONSTRAINT "ValuationSnapshot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDiligenceCase" ADD CONSTRAINT "DueDiligenceCase_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdCheck" ADD CONSTRAINT "DdCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "DueDiligenceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowAccount" ADD CONSTRAINT "EscrowAccount_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowMilestone" ADD CONSTRAINT "EscrowMilestone_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
