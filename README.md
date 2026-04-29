# CS621 Term Project — Contract & Legal Domain (Node.js / TypeScript)

ทีม Legal มีหน้าที่ในกระบวนการ Real-Estate ทั้งหมด 3 flow ตาม sequence diagram จึงแยกเป็น **3 microservices** เขียนด้วย **Node.js + TypeScript** ใช้ **KafkaJS** + **Express** + **node-postgres (`pg`)**

| # | Service | Flow | Port | DB Schema | Consume | Produce |
|---|---------|------|------|----|---------|---------|
| 1 | `contract-service` | Flow 2 (Selling) | 8081 | `contract` | `booking.order.confirmed-topic` | `contract.draft.created-topic` |
| 2 | `acquisition-service` | Flow 1 (Acquire) | 8082 | `acquisition` | `property.survey.received-topic`, `acquisition.approval.granted-topic` | `acquisition.approval.requested-topic`, `acquisition.contract.drafted-topic` |
| 3 | `warranty-service` | Flow 4 (Defect) | 8083 | `warranty` | `warranty.coverage.registered-topic`, `warranty.defect.reported-topic` | `warranty.coverage.verified-topic` |

> Topic naming: `[domain].[datatype].[action]-topic` — DDD: Aggregate Root + Entity + Value Object + Domain Event

---

## 🚀 Deployment Architecture

```
                  [Confluent Cloud Kafka]
                    ▲   ▲   ▲   ▲
                    │   │   │   │   (publish/subscribe)
        ┌───────────┴───┴───┴───┴───────────┐
        │                                   │
[Render Web]      [Render Web]      [Render Web]
 contract            acquisition       warranty
   :8081               :8082             :8083
   │                   │                  │
   └─────────┬─────────┴──────────────────┘
             ▼
[Supabase Postgres]
  ├── schema "contract"      (contracts, contract_drafts)
  ├── schema "acquisition"   (acquisitions, willing_contracts)
  └── schema "warranty"      (warranties, warranty_scope, warranty_claims)

[UptimeRobot] → ping /health ทุก 5 นาที × 3 services (กัน Render free tier sleep)
```

---

## Mode A — Local development (Docker Compose)

ครบ stack ใน 1 คำสั่ง: Kafka + Postgres + 3 services

```bash
docker-compose up --build
```

รอจน log แสดง `[Boot] ... ready on http://localhost:80xx` ของทั้ง 3 services

---

## Mode B — Deploy to Production (Render + Supabase + Confluent Cloud)

### Step 1: Setup Supabase Postgres

1. สร้าง project ใหม่ใน Supabase (free tier)
2. ไปที่ **Project Settings → Database → Connection string → Connection pooling**
3. คัดลอก URI (port `6543`) — รูปแบบ:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
4. (ไม่ต้อง create schema เอง — service จะสร้าง schema + tables ตอน boot)

### Step 2: Setup Confluent Cloud Kafka

1. สร้าง 9 topics:
   ```
   booking.order.confirmed-topic
   contract.draft.created-topic
   property.survey.received-topic
   acquisition.approval.requested-topic
   acquisition.approval.granted-topic
   acquisition.contract.drafted-topic
   warranty.coverage.registered-topic
   warranty.defect.reported-topic
   warranty.coverage.verified-topic
   ```
2. สร้าง API Key + Secret

### Step 3: Deploy to Render

1. push repo ขึ้น GitHub
2. ใน Render Dashboard → **New → Blueprint** → เชื่อม GitHub repo
3. Render จะอ่าน `render.yaml` และสร้าง 3 web services อัตโนมัติ
4. ในแต่ละ service ใส่ env vars (Render → service → Environment):
   ```
   DATABASE_URL              = <Supabase pooler URI>
   KAFKA_BOOTSTRAP_SERVERS   = pkc-619z3.us-east1.gcp.confluent.cloud:9092
   KAFKA_API_KEY             = <Confluent key>
   KAFKA_API_SECRET          = <Confluent secret>
   ```

### Step 4: Setup UptimeRobot pinger (กัน Render free sleep)

1. สมัคร UptimeRobot ฟรี
2. สร้าง 3 monitors — ping `/health` ของแต่ละ service ทุก 5 นาที:
   ```
   https://contract-service-xxx.onrender.com/health
   https://acquisition-service-xxx.onrender.com/health
   https://warranty-service-xxx.onrender.com/health
   ```

---

## ทดสอบแต่ละ flow (event triggers)

```bash
# Flow 1: Acquire Property
curl -X POST http://localhost:8082/api/test/property-surveyed
# ดู log → คัดลอก acquisitionId
curl -X POST http://localhost:8082/api/test/acquisition-approved \
  -H "Content-Type: application/json" \
  -d '{"acquisitionId":"<UUID-from-step1>","approvedPrice":5500000}'

# Flow 2: Selling Property
curl -X POST http://localhost:8081/api/test/booking-confirmed

# Flow 4: Defect Report
curl -X POST http://localhost:8083/api/test/warranty-registered
curl -X POST http://localhost:8083/api/test/defect-reported \
  -H "Content-Type: application/json" \
  -d '{"contractId":"<same-as-warranty>","unitId":"<uuid>","customerId":"<uuid>","defectCategory":"ELECTRICAL","description":"Power outlet broken"}'
```

## Query API

```bash
# Contract
curl http://localhost:8081/api/contracts/<contractId>
curl 'http://localhost:8081/api/contracts?customerId=<uuid>'

# Acquisition
curl http://localhost:8082/api/acquisitions/<acquisitionId>
curl 'http://localhost:8082/api/acquisitions?status=APPROVAL_REQUESTED'

# Warranty
curl http://localhost:8083/api/warranties/<contractId>
curl http://localhost:8083/api/warranties/<warrantyId>/claims

# Health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
```

---

## Project structure (per service)

```
{service}/
├── package.json
├── tsconfig.json
├── Dockerfile
└── src/
    ├── index.ts           # boot: initSchema → ensureTopics → connect Kafka → start Express
    ├── config.ts          # env / topic names
    ├── db.ts              # pg Pool + initSchema (CREATE TABLE IF NOT EXISTS)
    ├── domain/            # Aggregate Root + Entity + Value Objects
    ├── repository/        # async pg queries
    ├── service/           # application service (commands)
    ├── kafka/             # KafkaJS client / consumers / producers
    └── routes/
        ├── test.ts        # POST /api/test/* (event simulators — dev only)
        └── query.ts       # GET /api/* (read state)
```

---

## Event Flow ทั้งระบบ

```
Flow 1: Acquire Property
  Inventory ──property.survey.received-topic──► [Acquisition Svc]
                                              ──acquisition.approval.requested-topic──► CEO
  CEO ──acquisition.approval.granted-topic──► [Acquisition Svc]
                                            ──acquisition.contract.drafted-topic──► Inventory

Flow 2: Selling Property
  Sales ──booking.order.confirmed-topic──► [Contract Svc]
                                         ──contract.draft.created-topic──► Property Verification

Flow 4: Defect Report
  Post-sale ──warranty.coverage.registered-topic──► [Warranty Svc]
  Post-sale ──warranty.defect.reported-topic──► [Warranty Svc]
                                              ──warranty.coverage.verified-topic──► Post-sale
```

---

## Notes / Caveats

- **Render free tier** sleeps after 15 min of no HTTP traffic — Kafka events accumulate during sleep, processed on wake (KafkaJS auto-reconnects from last committed offset). Use UptimeRobot to keep alive
- **Supabase free tier**: 500MB DB, autopause หลังนิ่ง 7 วัน — ต้อง resume manually ใน dashboard
- **Confluent Cloud free**: $400 credit / 30 วัน — ย้ายเจ้าอื่นหลังหมดอายุ
- **Schema-per-service** แต่ละ service ใช้ Postgres `search_path` แยก schema ของตัวเอง — DB เดียวแต่ table แยก domain
- Java code เดิมเก็บไว้ที่ `_java-archive/` (อ้างอิงเฉย ๆ)

---

## ปิดระบบ local

```bash
docker-compose down -v   # -v ลบ volume postgres ทิ้งด้วย
```
