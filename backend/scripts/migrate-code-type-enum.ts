import { Client } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

const KEEP_CODE_TYPES = ['Application', 'Web Application', 'Service Support'];
const FALLBACK_CODE_TYPE = 'Application';
const ENUM_TYPE = 'issues_codetype_enum';
const OLD_ENUM_TYPE = 'issues_codetype_enum_old';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await client.query('BEGIN');

    const remapped = await client.query(
      `UPDATE issues SET "codeType" = $1 WHERE "codeType"::text != ALL($2::text[])`,
      [FALLBACK_CODE_TYPE, KEEP_CODE_TYPES],
    );
    console.log(`✓ Remapped ${remapped.rowCount} issue(s) with a retired codeType to "${FALLBACK_CODE_TYPE}"`);

    await client.query(`ALTER TYPE "${ENUM_TYPE}" RENAME TO "${OLD_ENUM_TYPE}"`);
    await client.query(
      `CREATE TYPE "${ENUM_TYPE}" AS ENUM (${KEEP_CODE_TYPES.map((v) => `'${v}'`).join(', ')})`,
    );
    await client.query(
      `ALTER TABLE issues ALTER COLUMN "codeType" TYPE "${ENUM_TYPE}" USING "codeType"::text::"${ENUM_TYPE}"`,
    );
    await client.query(`DROP TYPE "${OLD_ENUM_TYPE}"`);

    await client.query('COMMIT');
    console.log(`✓ ${ENUM_TYPE} now only allows: ${KEEP_CODE_TYPES.join(', ')}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to migrate codeType enum:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
