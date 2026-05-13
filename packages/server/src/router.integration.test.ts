import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { appRouter } from './router.js';
import { prisma } from './db.js';

const caller = appRouter.createCaller({});

const validApiRecord = {
  client_id: 'patient_a',
  date_testing: '2024-06-15',
  date_birthdate: '1980-01-01',
  gender: 1,
  ethnicity: 2,
  creatine: 1.3,
  chloride: 100,
  fasting_glucose: 90,
  potassium: 4.5,
  sodium: 140,
  total_calcium: 9.5,
  total_protein: 7,
  creatine_unit: 'mgdl',
  chloride_unit: 'mmoll',
  fasting_glucose_unit: 'mgdl',
  potassium_unit: 'mmoll',
  sodium_unit: 'mmoll',
  total_calcium_unit: 'mgdl',
  total_protein_unit: 'gdl',
};

const validAddDataInput = {
  clientId: 'manual_patient',
  dateTesting: '2024-07-01',
  birthdate: '1990-05-13',
  gender: 2 as const,
  ethnicity: 3 as const,
  creatine: 0.9,
  creatineUnit: 'mgdl',
  chloride: 102,
  chlorideUnit: 'mmoll',
  fastingGlucose: 95,
  fastingGlucoseUnit: 'mgdl',
  potassium: 4.2,
  potassiumUnit: 'mmoll',
  sodium: 138,
  sodiumUnit: 'mmoll',
  totalCalcium: 9.3,
  totalCalciumUnit: 'mgdl',
  totalProtein: 6.9,
  totalProteinUnit: 'gdl',
};

beforeEach(async () => {
  await prisma.patient.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function mockFetch(records: unknown[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => records,
  }));
}

describe('patient.fetchFromApi', () => {
  it('imports records into an empty database', async () => {
    mockFetch([validApiRecord]);

    const result = await caller.patient.fetchFromApi();

    expect(result.imported).toBe(1);
    const patients = await prisma.patient.findMany({ include: { testResults: true } });
    expect(patients).toHaveLength(1);
    expect(patients[0]?.clientId).toBe('patient_a');
    expect(patients[0]?.testResults).toHaveLength(1);
    expect(patients[0]?.testResults[0]?.creatine).toBe(1.3);
  });

  it('is idempotent across repeated calls with same payload', async () => {
    mockFetch([validApiRecord]);
    await caller.patient.fetchFromApi();

    mockFetch([validApiRecord]);
    await caller.patient.fetchFromApi();

    const patients = await prisma.patient.findMany({ include: { testResults: true } });
    expect(patients).toHaveLength(1);
    expect(patients[0]?.testResults).toHaveLength(1);
  });

  it('updates patient demographics when the same clientId is fetched again', async () => {
    mockFetch([validApiRecord]);
    await caller.patient.fetchFromApi();

    mockFetch([{ ...validApiRecord, date_birthdate: '1975-12-31', gender: 2 }]);
    await caller.patient.fetchFromApi();

    const patient = await prisma.patient.findUnique({ where: { clientId: 'patient_a' } });
    expect(patient?.gender).toBe(2);
    expect(patient?.birthdate.toISOString()).toBe('1975-12-31T00:00:00.000Z');
  });

  it('updates test result biomarkers when the same patient+date is fetched again', async () => {
    mockFetch([validApiRecord]);
    await caller.patient.fetchFromApi();

    mockFetch([{ ...validApiRecord, creatine: 2.5 }]);
    await caller.patient.fetchFromApi();

    const patients = await prisma.patient.findMany({ include: { testResults: true } });
    expect(patients[0]?.testResults).toHaveLength(1);
    expect(patients[0]?.testResults[0]?.creatine).toBe(2.5);
  });

  it('throws when mock API responds with non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(caller.patient.fetchFromApi()).rejects.toThrow(/503/);
  });

  it('throws when fetch fails entirely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    await expect(caller.patient.fetchFromApi()).rejects.toThrow(/Failed to reach mock API/);
  });

  it('throws when mock API returns malformed records', async () => {
    mockFetch([{ ...validApiRecord, gender: 99 }]);

    await expect(caller.patient.fetchFromApi()).rejects.toThrow(/unexpected data shape/);
  });
});

describe('patient.getAll', () => {
  it('returns an empty array when database is empty', async () => {
    const patients = await caller.patient.getAll();
    expect(patients).toEqual([]);
  });

  it('returns patients sorted by clientId with test results sorted by date', async () => {
    mockFetch([
      { ...validApiRecord, client_id: 'b_patient', date_testing: '2024-02-01' },
      { ...validApiRecord, client_id: 'a_patient', date_testing: '2024-03-01' },
      { ...validApiRecord, client_id: 'a_patient', date_testing: '2024-01-01' },
    ]);
    await caller.patient.fetchFromApi();

    const patients = await caller.patient.getAll();

    expect(patients.map(p => p.clientId)).toEqual(['a_patient', 'b_patient']);
    const aPatient = patients[0];
    expect(aPatient?.testResults.map(tr => tr.dateTesting.toISOString())).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
    ]);
  });

  it('returns biomarker values as numbers, not Decimal objects', async () => {
    mockFetch([validApiRecord]);
    await caller.patient.fetchFromApi();

    const patients = await caller.patient.getAll();
    const tr = patients[0]?.testResults[0];

    expect(typeof tr?.creatine).toBe('number');
    expect(typeof tr?.sodium).toBe('number');
  });
});

describe('patient.addData', () => {
  it('creates a new patient and test result', async () => {
    const result = await caller.patient.addData(validAddDataInput);

    expect(result.creatine).toBe(0.9);
    const patients = await prisma.patient.findMany({ include: { testResults: true } });
    expect(patients).toHaveLength(1);
    expect(patients[0]?.clientId).toBe('manual_patient');
    expect(patients[0]?.testResults).toHaveLength(1);
  });

  it('preserves demographics for an existing patient (update: {})', async () => {
    await caller.patient.addData(validAddDataInput);

    await caller.patient.addData({
      ...validAddDataInput,
      dateTesting: '2024-08-01',
      birthdate: '2000-01-01',
      gender: 1 as const,
      ethnicity: 1 as const,
    });

    const patient = await prisma.patient.findUnique({ where: { clientId: 'manual_patient' } });
    expect(patient?.birthdate.toISOString()).toBe('1990-05-13T00:00:00.000Z');
    expect(patient?.gender).toBe(2);
    expect(patient?.ethnicity).toBe(3);
  });

  it('upserts a test result on duplicate patient+date', async () => {
    await caller.patient.addData(validAddDataInput);
    await caller.patient.addData({ ...validAddDataInput, creatine: 1.5 });

    const patients = await prisma.patient.findMany({ include: { testResults: true } });
    expect(patients[0]?.testResults).toHaveLength(1);
    expect(patients[0]?.testResults[0]?.creatine).toBe(1.5);
  });
});

describe('patient.reset', () => {
  it('deletes all patients and cascades to test results', async () => {
    mockFetch([
      validApiRecord,
      { ...validApiRecord, client_id: 'patient_b' },
    ]);
    await caller.patient.fetchFromApi();

    const before = await prisma.patient.count();
    expect(before).toBe(2);

    await caller.patient.reset();

    const after = await prisma.patient.count();
    const trAfter = await prisma.testResult.count();
    expect(after).toBe(0);
    expect(trAfter).toBe(0);
  });
});
