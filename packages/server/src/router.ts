import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from './trpc.js';
import { prisma } from './db.js';

const MOCK_API_URL = 'https://mockapi-furw4tenlq-ez.a.run.app/data';

export function parseDateOnly(input: string): Date {
  return new Date(`${input}T00:00:00.000Z`);
}

export const apiRecordSchema = z.object({
  client_id: z.string(),
  date_testing: z.string().date(),
  date_birthdate: z.string().date(),
  gender: z.union([z.literal(1), z.literal(2)]),
  ethnicity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  creatine: z.number().finite(),
  chloride: z.number().finite(),
  fasting_glucose: z.number().finite(),
  potassium: z.number().finite(),
  sodium: z.number().finite(),
  total_calcium: z.number().finite(),
  total_protein: z.number().finite(),
  creatine_unit: z.string(),
  chloride_unit: z.string(),
  fasting_glucose_unit: z.string(),
  potassium_unit: z.string(),
  sodium_unit: z.string(),
  total_calcium_unit: z.string(),
  total_protein_unit: z.string(),
});

export const addDataSchema = z.object({
  clientId: z.string().min(1),
  dateTesting: z.string().date(),
  birthdate: z.string().date(),
  gender: z.union([z.literal(1), z.literal(2)]),
  ethnicity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  creatine: z.number().finite(),
  creatineUnit: z.string(),
  chloride: z.number().finite(),
  chlorideUnit: z.string(),
  fastingGlucose: z.number().finite(),
  fastingGlucoseUnit: z.string(),
  potassium: z.number().finite(),
  potassiumUnit: z.string(),
  sodium: z.number().finite(),
  sodiumUnit: z.string(),
  totalCalcium: z.number().finite(),
  totalCalciumUnit: z.string(),
  totalProtein: z.number().finite(),
  totalProteinUnit: z.string(),
});

export const appRouter = router({
  patient: router({
    getAll: publicProcedure.query(() => {
      return prisma.patient.findMany({
        include: { testResults: { orderBy: { dateTesting: 'asc' } } },
        orderBy: { clientId: 'asc' },
      });
    }),

    fetchFromApi: publicProcedure.mutation(async () => {
      let response: Response;
      try {
        response = await fetch(MOCK_API_URL, { signal: AbortSignal.timeout(10000) });
      } catch (err) {
        console.error('Mock API fetch failed:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reach mock API',
        });
      }
      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Mock API returned ${response.status}`,
        });
      }

      const raw: unknown = await response.json();
      const parsed = z.array(apiRecordSchema).safeParse(raw);
      if (!parsed.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Mock API returned unexpected data shape',
        });
      }
      const records = parsed.data;

      await prisma.$transaction(async (tx) => {
        for (const record of records) {
          const patientData = {
            birthdate: parseDateOnly(record.date_birthdate),
            gender: record.gender,
            ethnicity: record.ethnicity,
          };

          const biomarkerData = {
            creatine: record.creatine,
            creatineUnit: record.creatine_unit,
            chloride: record.chloride,
            chlorideUnit: record.chloride_unit,
            fastingGlucose: record.fasting_glucose,
            fastingGlucoseUnit: record.fasting_glucose_unit,
            potassium: record.potassium,
            potassiumUnit: record.potassium_unit,
            sodium: record.sodium,
            sodiumUnit: record.sodium_unit,
            totalCalcium: record.total_calcium,
            totalCalciumUnit: record.total_calcium_unit,
            totalProtein: record.total_protein,
            totalProteinUnit: record.total_protein_unit,
          };

          const patient = await tx.patient.upsert({
            where: { clientId: record.client_id },
            create: { clientId: record.client_id, ...patientData },
            update: patientData,
          });

          await tx.testResult.upsert({
            where: {
              patientId_dateTesting: {
                patientId: patient.id,
                dateTesting: parseDateOnly(record.date_testing),
              },
            },
            create: {
              patientId: patient.id,
              dateTesting: parseDateOnly(record.date_testing),
              ...biomarkerData,
            },
            update: biomarkerData,
          });
        }
      }, { timeout: 30000, maxWait: 5000 });

      return { imported: records.length };
    }),

    reset: publicProcedure.mutation(async () => {
      await prisma.patient.deleteMany();
      return { success: true };
    }),

    addData: publicProcedure.input(addDataSchema).mutation(async ({ input }) => {
      const { clientId, dateTesting, birthdate, gender, ethnicity, ...biomarkerData } = input;

      const patient = await prisma.patient.upsert({
        where: { clientId },
        create: { clientId, birthdate: parseDateOnly(birthdate), gender, ethnicity },
        update: {},
      });

      const testDate = parseDateOnly(dateTesting);

      return prisma.testResult.upsert({
        where: { patientId_dateTesting: { patientId: patient.id, dateTesting: testDate } },
        create: { patientId: patient.id, dateTesting: testDate, ...biomarkerData },
        update: biomarkerData,
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
