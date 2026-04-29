import { Pool, type PoolClient } from 'pg';

const SCHEMA = 'acquisition';

const sslEnabled = process.env.DATABASE_SSL !== 'false';

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

pool.on('connect', (client) => {
  client.query(`SET search_path TO ${SCHEMA}, public`).catch((err) => {
    console.error('[DB] Failed to set search_path:', err);
  });
});

export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initSchema(): Promise<void> {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.willing_contracts (
      willing_contract_id UUID PRIMARY KEY,
      file_url            TEXT,
      agreed_price        NUMERIC,
      template_id         UUID,
      drafted_at          TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.acquisitions (
      acquisition_id      UUID PRIMARY KEY,
      status              TEXT NOT NULL,
      version             INTEGER NOT NULL DEFAULT 0,
      created_at          TIMESTAMPTZ NOT NULL,
      approved_at         TIMESTAMPTZ,
      survey_id           UUID NOT NULL,
      property_id         UUID NOT NULL,
      address             TEXT,
      area_sqm            NUMERIC,
      estimated_value     NUMERIC,
      zone_type           TEXT,
      seller_id           UUID,
      seller_name         TEXT,
      seller_contact      TEXT,
      willing_contract_id UUID REFERENCES ${SCHEMA}.willing_contracts(willing_contract_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_acquisitions_status ON ${SCHEMA}.acquisitions(status);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_acquisitions_survey ON ${SCHEMA}.acquisitions(survey_id);
  `);

  console.log(`[DB] Schema "${SCHEMA}" ready`);
}
