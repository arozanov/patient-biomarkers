import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/patient_biomarkers_test?schema=public',
    },
    globalSetup: ['./vitest.global-setup.ts'],
    // Integration tests share the patient_biomarkers_test database and truncate in beforeEach. Run serially to avoid clobbering.
    fileParallelism: false,
    unstubGlobals: true,
  },
});
