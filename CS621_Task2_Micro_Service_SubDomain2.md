# CS621 Task 2 Team Contract & Legal — Sub-domain 2: Warranty Verification
**วริศรา พิลาสุข 6809036087**

---

## 1. Microservice

Domain Model Design ของทีม Contract & Legal แบ่งออกเป็น 2 Sub-domain ในเอกสารนี้จะแสดงการนำ **Sub-domain 2: Warranty Verification** มา implement เป็น microservice โดยเลือก 1 event flow คือ **WarrantyVerified**

Sub-domain นี้รับผิดชอบขั้นตอนใน **Flow 4: Defect Report** จาก sequence diagram โดยทีม Legal มีหน้าที่:
- ตรวจสอบ property record ของลูกค้าที่แจ้ง defect
- ตรวจสอบ warranty ที่ยังมีผลบังคับใช้ (effective period, coverage scope)
- ยืนยันความคุ้มครอง (confirm coverage) กลับไปยังทีม Post-sale เพื่อให้ดำเนินการนัดซ่อมต่อไป

---

## 2. DDD Tactical Patterns ที่เลือกใช้

| Pattern | สิ่งที่ implement | เหตุผลที่เลือก |
|---------|------------------|---------------|
| **Aggregate Root** | `Warranty` | เป็นจุดเข้าถึงเดียวของ aggregate ควบคุม lifecycle ของ `WarrantyClaim` และการตรวจสอบ coverage ใช้ `@Version` สำหรับ optimistic locking |
| **Entity** | `WarrantyClaim` | มี lifecycle ของตัวเอง (PENDING → VERIFIED → COVERED/REJECTED) แต่ access ผ่าน Warranty Root เท่านั้น map เป็น `@OneToMany` ภายใน aggregate |
| **Value Object** | `CoveragePeriod`, `CoverageScope`, `DefectCategory` | ไม่มี identity กำหนดค่าครั้งเดียว immutable ใช้ `@Embeddable` ของ JPA |
| **Domain Event** | `WarrantyVerifiedEvent` | ใช้ past tense ตาม DDD convention เป็น immutable record ส่งผ่าน Kafka เชื่อมระหว่าง sub-domain |
| **Factory Method** | `Warranty.verifyClaim()` | encapsulate business logic การตรวจสอบ warranty + สร้าง `WarrantyClaim` ไว้ใน Root ไม่ให้ภายนอกสร้าง entity โดยตรง |
| **Domain Service** | `CoverageEvaluator` | logic การประเมินว่า defect อยู่ใน coverage scope หรือไม่ ไม่เหมาะอยู่ใน entity เพราะข้าม aggregate |
| **Repository** | `WarrantyRepository` | abstraction layer สำหรับ persistence ใช้ Spring Data JPA |

---

## 3. Event Flow ที่ implement

```
warranty.defect.reported-topic (input)
  จาก Post-sale Service
        ↓
DefectReportedConsumer
  Kafka Consumer
        ↓
┌───────────────────────────────────────────────────────────────┐
│                  WarrantyVerificationService                  │
│                                                               │
│  Warranty ──► verifyClaim() ──► WarrantyClaim ──► save()      │
│  (Root)       (Factory)         (Entity)         (Repository) │
│                                                               │
│            CoverageEvaluator (Domain Service)                 │
└───────────────────────────────────────────────────────────────┘
        ↓
WarrantyVerifiedEvent
  (Domain Event)
        ↓
WarrantyVerifiedProducer
  Kafka Producer
        ↓
warranty.coverage.verified-topic (output)
  ส่งต่อไป Post-sale Service เพื่อนัดซ่อม
```

**Input event:** `warranty.defect.reported-topic` จาก Post-sale Service (เมื่อลูกค้าแจ้ง defect)
**Output event:** `warranty.coverage.verified-topic` ส่งกลับให้ Post-sale Service เพื่อ schedule repair

---

## 4. Aggregate Design

- **Warranty (Root)** เก็บแค่ ID อ้างอิงไปยัง domain อื่น (`contractId`, `unitId`, `customerId`) ไม่เก็บข้อมูลซ้ำ เพื่อหลีกเลี่ยง inconsistency เมื่อ domain ต้นทางเปลี่ยนแปลง
- **WarrantyClaim (Entity)** ถูกสร้างผ่าน factory method `Warranty.verifyClaim()` เท่านั้น ภายนอก aggregate ไม่สามารถสร้างหรือแก้ไขได้โดยตรง
- **Value Objects** (`CoveragePeriod`, `CoverageScope`, `DefectCategory`) ใช้ `@Embeddable` ฝังอยู่ใน Warranty / WarrantyClaim table โดยตรง ไม่ต้องสร้าง table แยก เพราะไม่มี identity และผูกกับ aggregate แบบ 1:1
- **Invariant ที่ Aggregate ปกป้อง:**
  - `WarrantyClaim` จะมี `status = COVERED` ได้ก็ต่อเมื่อ `defectReportedAt` อยู่ภายใน `CoveragePeriod` และ `defectCategory` อยู่ใน `CoverageScope`
  - 1 `defectId` สามารถมี `WarrantyClaim` ที่ active ได้แค่ 1 รายการเท่านั้น

---

## 5. Kafka Event Design

### Consume: `warranty.defect.reported-topic`

| Field | Type | คำอธิบาย |
|-------|------|---------|
| defectId | string (uuid) | ID ของ defect ที่ลูกค้าแจ้ง |
| contractId | string (uuid) | สัญญาที่เกี่ยวข้อง |
| unitId | string (uuid) | unit ที่พบ defect |
| customerId | string (uuid) | ลูกค้าผู้แจ้ง |
| defectCategory | enum | ประเภทของ defect เช่น STRUCTURAL, ELECTRICAL, PLUMBING |
| description | string | รายละเอียด defect |
| reportedAt | ISO8601 | เวลาที่ลูกค้าแจ้ง |

### Produce: `warranty.coverage.verified-topic`

| Field | Type | คำอธิบาย |
|-------|------|---------|
| warrantyClaimId | uuid | ID ของ claim ที่ระบบสร้างขึ้น |
| warrantyId | uuid | ID ของ warranty ต้นทาง |
| defectId | uuid | อ้างอิง defect ต้นทาง |
| contractId | uuid | สัญญาที่เกี่ยวข้อง |
| unitId | uuid | unit ที่พบ defect |
| customerId | uuid | ลูกค้าผู้แจ้ง |
| coverageStatus | enum | `COVERED` / `REJECTED` |
| coverageReason | string | เหตุผลของผลการตรวจสอบ |
| verifiedAt | ISO8601 | เวลาที่ตรวจสอบเสร็จ |
| expiresAt | ISO8601 | วันสิ้นสุด warranty |

---

## 6. วิธีรันระบบ

```bash
# 1. Start Kafka + Spring Boot
docker-compose up --build

# 2. ทดสอบ
curl -X POST http://localhost:8082/api/test/defect-reported
```

ดูผลลัพธ์ใน log ของ docker-compose และ H2 Console
(http://localhost:8082/h2-console, JDBC URL: `jdbc:h2:mem:warrantydb`)

โดยสามารถดูรายละเอียดการ run โค้ดเพิ่มเติมได้ใน `README.md`
