import pg from 'pg';
import { execSync } from 'node:child_process';

const TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/patient_biomarkers_test?schema=public';

export async function setup() {
  const admin = new pg.Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await admin.connect();

  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'patient_biomarkers_test'");
  if (exists.rowCount === 0) {
    await admin.query('CREATE DATABASE patient_biomarkers_test');
  }
  await admin.end();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
