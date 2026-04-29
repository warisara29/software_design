import { Pool, type PoolClient } from 'pg';

const SCHEMA = 'warranty';

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
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.warranties (
      warranty_id    UUID PRIMARY KEY,
      version        INTEGER NOT NULL DEFAULT 0,
      contract_id    UUID NOT NULL,
      unit_id        UUID NOT NULL,
      customer_id    UUID NOT NULL,
      starts_at      TIMESTAMPTZ NOT NULL,
      ends_at        TIMESTAMPTZ NOT NULL,
      registered_at  TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_warranties_contract ON ${SCHEMA}.warranties(contract_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_warranties_unit ON ${SCHEMA}.warranties(unit_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.warranty_scope (
      warranty_id UUID NOT NULL REFERENCES ${SCHEMA}.warranties(warranty_id) ON DELETE CASCADE,
      category    TEXT NOT NULL,
      PRIMARY KEY (warranty_id, category)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA}.warranty_claims (
      claim_id        UUID PRIMARY KEY,
      warranty_id     UUID NOT NULL REFERENCES ${SCHEMA}.warranties(warranty_id) ON DELETE CASCADE,
      defect_id       UUID NOT NULL,
      defect_category TEXT NOT NULL,
      description     TEXT,
      reported_at     TIMESTAMPTZ NOT NULL,
      coverage_status TEXT NOT NULL,
      coverage_reason TEXT,
      verified_at     TIMESTAMPTZ
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_claims_warranty ON ${SCHEMA}.warranty_claims(warranty_id);
  `);

  console.log(`[DB] Schema "${SCHEMA}" ready`);
}
