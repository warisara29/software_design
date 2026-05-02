/**
 * Pretty-print JSON for human-readable Kafka logs on Render.
 * Falls through to the raw string if the input isn't valid JSON.
 */
export function prettyJson(raw: string | object): string {
  if (typeof raw === 'object') return JSON.stringify(raw, null, 2);
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
