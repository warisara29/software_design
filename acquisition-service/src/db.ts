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

  // Rich property + unit metadata captured from CEO's survey — added incrementally
  await pool.query(`
    ALTER TABLE ${SCHEMA}.acquisitions
      ADD COLUMN IF NOT EXISTS property_developer TEXT,
      ADD COLUMN IF NOT EXISTS property_name      TEXT,
      ADD COLUMN IF NOT EXISTS property_type      TEXT,
      ADD COLUMN IF NOT EXISTS property_code      TEXT,
      ADD COLUMN IF NOT EXISTS city               TEXT,
      ADD COLUMN IF NOT EXISTS currency           TEXT,
      ADD COLUMN IF NOT EXISTS registration       TEXT,
      ADD COLUMN IF NOT EXISTS created_by         TEXT,
      ADD COLUMN IF NOT EXISTS unit_id            UUID,
      ADD COLUMN IF NOT EXISTS unit_code          TEXT,
      ADD COLUMN IF NOT EXISTS unit_area          NUMERIC,
      ADD COLUMN IF NOT EXISTS bedroom_type       TEXT,
      ADD COLUMN IF NOT EXISTS unit_address       TEXT,
      ADD COLUMN IF NOT EXISTS bathrooms          INTEGER,
      ADD COLUMN IF NOT EXISTS view               TEXT,
      ADD COLUMN IF NOT EXISTS furniture          TEXT,
      ADD COLUMN IF NOT EXISTS facility           TEXT,
      ADD COLUMN IF NOT EXISTS picture_urls       TEXT[],
      ADD COLUMN IF NOT EXISTS cost               NUMERIC,
      ADD COLUMN IF NOT EXISTS min_sale_price     NUMERIC,
      ADD COLUMN IF NOT EXISTS price              NUMERIC,
      ADD COLUMN IF NOT EXISTS sale_team_lead     TEXT,
      ADD COLUMN IF NOT EXISTS commission         NUMERIC,
      ADD COLUMN IF NOT EXISTS external_status    TEXT;
  `);

  console.log(`[DB] Schema "${SCHEMA}" ready`);
}
