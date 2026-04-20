"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabase = resetDatabase;
async function resetDatabase(prisma) {
    await prisma.escrowMilestone.deleteMany();
    await prisma.escrowAccount.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.ddCheck.deleteMany();
    await prisma.dueDiligenceCase.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.valuationSnapshot.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.property.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
}
