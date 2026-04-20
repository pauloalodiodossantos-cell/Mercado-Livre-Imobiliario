import type { PrismaClient } from "@prisma/client";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
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
