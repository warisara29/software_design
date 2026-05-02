#!/usr/bin/env node
/**
 * Backup script: publish ceo.kyc.completed manually
 *
 * ใช้กรณีทีม CEO ยังไม่ publish event นี้ — เพื่อ trigger Stage 2 ของ Flow 2
 * (Legal จะรับ → publish property.lease.inspected + contract.drafted)
 *
 * วิธีใช้:
 *   # ใช้ contractId (recommended — Legal ค้นหา contract ตรง ๆ)
 *   node scripts/publish-ceo-kyc.mjs --contractId=<uuid>
 *
 *   # หรือใช้ customerId (Legal ค้นหา contract ล่าสุดของลูกค้า)
 *   node scripts/publish-ceo-kyc.mjs --customerId=<uuid>
 *
 *   # ส่ง REJECTED แทน APPROVED (default)
 *   node scripts/publish-ceo-kyc.mjs --contractId=<uuid> --kycStatus=REJECTED
 *
 * ต้องมี .env ที่ root พร้อม:
 *   KAFKA_BROKERS=...
 *   KAFKA_USERNAME=...
 *   KAFKA_PASSWORD=...
 *   KAFKA_SSL=true
 *
 * รันได้ทั้งจาก root หรือจาก contract-service:
 *   npx --yes -p kafkajs node scripts/publish-ceo-kyc.mjs --contractId=...
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// load .env from project root (one level up from scripts/)
const envPath = resolve(__dirname, '..', '.env');
try {
  const env = readFileSync(envPath, 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env optional — env vars may already be set
}

// parse args: --key=value
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.join('=')];
  }),
);

if (!args.contractId && !args.customerId) {
  console.error(
    'Usage: node scripts/publish-ceo-kyc.mjs --contractId=<uuid> [--kycStatus=APPROVED]\n' +
      '   or: node scripts/publish-ceo-kyc.mjs --customerId=<uuid> [--kycStatus=APPROVED]',
  );
  process.exit(1);
}

const payload = {
  kycId: args.kycId ?? randomUUID(),
  contractId: args.contractId,
  customerId: args.customerId,
  kycStatus: args.kycStatus ?? 'APPROVED',
  verifiedAt: args.verifiedAt ?? new Date().toISOString(),
  verifiedBy: args.verifiedBy ?? 'ceo-test-simulator',
};

const topic = args.topic ?? 'ceo.kyc.completed';

// dynamic import so script works whether kafkajs is installed at root or in subservice
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let Kafka;
try {
  ({ Kafka } = await import('kafkajs'));
} catch {
  // fallback to subservice's node_modules using CommonJS resolver (handles dir imports)
  const subservicePath = resolve(__dirname, '..', 'contract-service', 'node_modules', 'kafkajs');
  ({ Kafka } = require(subservicePath));
}

const kafka = new Kafka({
  clientId: 'ceo-kyc-simulator',
  brokers: (process.env.KAFKA_BROKERS ?? process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SSL === 'true',
  sasl:
    process.env.KAFKA_SSL === 'true'
      ? {
          mechanism: 'plain',
          username: process.env.KAFKA_USERNAME ?? process.env.KAFKA_API_KEY,
          password: process.env.KAFKA_PASSWORD ?? process.env.KAFKA_API_SECRET,
        }
      : undefined,
});

const producer = kafka.producer();
await producer.connect();
console.log(`[publish-ceo-kyc] → ${topic}`);
console.log(JSON.stringify(payload, null, 2));

await producer.send({
  topic,
  messages: [
    {
      key: payload.contractId ?? payload.customerId ?? payload.kycId,
      value: JSON.stringify(payload),
    },
  ],
});

await producer.disconnect();
console.log(`[publish-ceo-kyc] ✅ sent — Legal consumer ควรเริ่ม process Stage 2 ของ Flow 2`);
