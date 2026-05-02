import { v5 as uuidv5 } from 'uuid';

/**
 * Stable namespace UUID for Real-Estate IDs across all services.
 * Same string input always maps to the same UUID — so multiple events
 * referring to the same business entity (e.g. "PROP-001") will land in
 * the same DB row.
 */
const RE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accept either a UUID or any string code (e.g. "PROP-001", "CUST-001")
 * and return a deterministic UUID compatible with our Postgres uuid columns.
 */
export function coerceToUuid(value: string | undefined | null): string {
  if (!value) return uuidv5('__null__', RE_NAMESPACE);
  if (UUID_REGEX.test(value)) return value;
  return uuidv5(value, RE_NAMESPACE);
}
