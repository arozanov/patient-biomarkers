import { describe, it, expect } from 'vitest';
import { parseDateOnly, apiRecordSchema, addDataSchema } from './router.js';

describe('parseDateOnly', () => {
  it('parses YYYY-MM-DD as UTC midnight', () => {
    const result = parseDateOnly('1990-05-13');
    expect(result.toISOString()).toBe('1990-05-13T00:00:00.000Z');
  });

  it('avoids local timezone shift', () => {
    const result = parseDateOnly('2024-01-01');
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
  });
});

describe('apiRecordSchema', () => {
  const validRecord = {
    client_id: 'abc123',
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

  it('accepts a valid record', () => {
    expect(apiRecordSchema.safeParse(validRecord).success).toBe(true);
  });

  it('rejects gender outside 1-2', () => {
    expect(apiRecordSchema.safeParse({ ...validRecord, gender: 3 }).success).toBe(false);
    expect(apiRecordSchema.safeParse({ ...validRecord, gender: 0 }).success).toBe(false);
  });

  it('rejects ethnicity outside 1-5', () => {
    expect(apiRecordSchema.safeParse({ ...validRecord, ethnicity: 6 }).success).toBe(false);
    expect(apiRecordSchema.safeParse({ ...validRecord, ethnicity: 0 }).success).toBe(false);
  });

  it('rejects NaN and Infinity in biomarker values', () => {
    expect(apiRecordSchema.safeParse({ ...validRecord, creatine: NaN }).success).toBe(false);
    expect(apiRecordSchema.safeParse({ ...validRecord, sodium: Infinity }).success).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(apiRecordSchema.safeParse({ ...validRecord, date_testing: '2024-13-40' }).success).toBe(false);
    expect(apiRecordSchema.safeParse({ ...validRecord, date_birthdate: 'not a date' }).success).toBe(false);
  });
});

describe('addDataSchema', () => {
  const validInput = {
    clientId: 'abc123',
    dateTesting: '2024-06-15',
    birthdate: '1980-01-01',
    gender: 1,
    ethnicity: 2,
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
  };

  it('accepts a valid input', () => {
    expect(addDataSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects empty clientId', () => {
    expect(addDataSchema.safeParse({ ...validInput, clientId: '' }).success).toBe(false);
  });

  it('rejects gender outside 1-2', () => {
    expect(addDataSchema.safeParse({ ...validInput, gender: 3 }).success).toBe(false);
  });

  it('rejects ethnicity outside 1-5', () => {
    expect(addDataSchema.safeParse({ ...validInput, ethnicity: 6 }).success).toBe(false);
  });

  it('rejects NaN and Infinity in biomarker values', () => {
    expect(addDataSchema.safeParse({ ...validInput, creatine: NaN }).success).toBe(false);
    expect(addDataSchema.safeParse({ ...validInput, sodium: Infinity }).success).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(addDataSchema.safeParse({ ...validInput, dateTesting: '2024-13-40' }).success).toBe(false);
    expect(addDataSchema.safeParse({ ...validInput, birthdate: 'not a date' }).success).toBe(false);
  });
});
