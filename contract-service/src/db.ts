import { Pool, type PoolClient } from 'pg';

const SCHEMA = 'contract';

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
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.contract_drafts (
      draft_id    UUID PRIMARY KEY,
      file_url    TEXT,
      template_id UUID,
      drafted_at  TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.contracts (
      contract_id        UUID PRIMARY KEY,
      status             TEXT NOT NULL,
      version            INTEGER NOT NULL DEFAULT 0,
      template_id        UUID,
      created_at         TIMESTAMPTZ NOT NULL,
      booking_id         UUID NOT NULL,
      customer_id        UUID NOT NULL,
      unit_id            UUID NOT NULL,
      buyer_id           UUID,
      seller_id          UUID,
      total_price        NUMERIC,
      deposit_amount     NUMERIC,
      penalty_conditions TEXT,
      draft_id           UUID REFERENCES ${SCHEMA}.contract_drafts(draft_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_contracts_customer ON ${SCHEMA}.contracts(customer_id);
  `);

  console.log(`[DB] Schema "${SCHEMA}" ready`);
}
