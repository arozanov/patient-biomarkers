import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    testResult: {
      creatine: {
        needs: { creatine: true },
        compute(tr: { creatine: Prisma.Decimal }) { return tr.creatine.toNumber(); },
      },
      chloride: {
        needs: { chloride: true },
        compute(tr: { chloride: Prisma.Decimal }) { return tr.chloride.toNumber(); },
      },
      fastingGlucose: {
        needs: { fastingGlucose: true },
        compute(tr: { fastingGlucose: Prisma.Decimal }) { return tr.fastingGlucose.toNumber(); },
      },
      potassium: {
        needs: { potassium: true },
        compute(tr: { potassium: Prisma.Decimal }) { return tr.potassium.toNumber(); },
      },
      sodium: {
        needs: { sodium: true },
        compute(tr: { sodium: Prisma.Decimal }) { return tr.sodium.toNumber(); },
      },
      totalCalcium: {
        needs: { totalCalcium: true },
        compute(tr: { totalCalcium: Prisma.Decimal }) { return tr.totalCalcium.toNumber(); },
      },
      totalProtein: {
        needs: { totalProtein: true },
        compute(tr: { totalProtein: Prisma.Decimal }) { return tr.totalProtein.toNumber(); },
      },
    },
  },
});
