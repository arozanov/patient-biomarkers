import type { Patient } from './trpc';

type TestResult = Patient['testResults'][number];

export function makeTestResult(
  id: number,
  dateTesting: Date,
  overrides: Partial<TestResult> = {},
): TestResult {
  return {
    id,
    patientId: 1,
    dateTesting,
    creatine: 1.3,
    creatineUnit: 'mgdl',
    chloride: 100,
    chlorideUnit: 'mmoll',
    fastingGlucose: 90,
    fastingGlucoseUnit: 'mgdl',
    potassium: 4.5,
    potassiumUnit: 'mmoll',
    sodium: 140,
    sodiumUnit: 'mmoll',
    totalCalcium: 9.5,
    totalCalciumUnit: 'mgdl',
    totalProtein: 7,
    totalProteinUnit: 'gdl',
    ...overrides,
  };
}

export function makePatient(
  id: number,
  clientId: string,
  overrides: Partial<Patient> = {},
): Patient {
  return {
    id,
    clientId,
    birthdate: new Date('1980-01-01T00:00:00.000Z'),
    gender: 1,
    ethnicity: 1,
    testResults: [],
    ...overrides,
  };
}
