import { Client } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

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

  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1); // remove leading /

  // Connect to the default postgres database to create the target DB
  url.pathname = '/postgres';
  const adminUrl = url.toString();

  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database "${dbName}" created successfully`);
    } else {
      console.log(`✓ Database "${dbName}" already exists`);
    }
  } catch (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
