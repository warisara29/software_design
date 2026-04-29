# Contract Draft Service

## CS621 — Task 2 | Microservice Design Document
### Contract & Legal — The Compliance Domain (คนที่ 1)

**Real Estate Ecosystem Platform** | v1.0

---

## รายละเอียด Microservice

Contract Draft Service เป็น microservice ตัวแรกใน chain ของทีม Contract & Legal ทำหน้าที่สร้างร่างสัญญาจะซื้อจะขายอัตโนมัติ เมื่อได้รับ event `booking.order.confirmed-topic` จากทีม Sales & Booking

### หน้าที่หลัก
- รับ event `booking.order.confirmed-topic` จากทีม Sales & Booking
- ตรวจสอบ KYC status ของลูกค้าก่อนดำเนินการ (Policy)
- ดึงข้อมูล unit จาก Inventory service และข้อมูลลูกค้าจาก KYC service
- สร้าง contract record ในฐานข้อมูล พร้อม status = `DRAFT`
- ส่ง event ไปยัง topic `contract.draft.created-topic` ให้ Property Verification

---

## สถาปัตยกรรม (Architecture)

### Event-Driven Architecture

```
Sales & Booking                 Contract Draft Service              Title Deed Service (S2)
      |                                  |                                   |
      |--- booking.order.confirmed-topic >|                                   |
      |                                  |-- ตรวจ KYC (Policy)               |
      |                                  |-- ดึงข้อมูล unit + customer       |
      |                                  |-- สร้าง contract (DRAFT)          |
      |                                  |--- contract.draft.created-topic ->|
```

### Kafka Topics

| Role     | Topic                    | คำอธิบาย                                      |
|----------|--------------------------|-----------------------------------------------|
| Consumer | `booking.order.confirmed-topic` | รับ event จาก Sales & Booking เมื่อ booking confirmed |
| Producer | `contract.draft.created-topic`  | ส่ง event เมื่อสร้าง draft สำเร็จ              |

### DDD Tactics

| Pattern          | Class                    | หน้าที่                                    |
|------------------|--------------------------|--------------------------------------------|
| Aggregate        | `Contract`               | Root entity ควบคุม contract lifecycle       |
| Domain Event     | `ContractDraftedEvent`   | Emit เมื่อสร้างสัญญาสำเร็จ                |
| Policy           | `KYCVerificationPolicy`  | Gate ตรวจสอบ KYC ก่อน proceed              |
| Repository       | `ContractRepository`     | Persist contract state ลงฐานข้อมูล         |

---

## โครงสร้างโปรเจกต์

```
src/main/java/dev/kritchalach/kafka/
├── KafkaApplication.java              # Main Application + Kafka Topic Beans
├── controller/
│   └── TestController.java            # REST endpoint สำหรับทดสอบ
├── domain/
│   ├── Contract.java                  # Aggregate Root Entity
│   └── ContractStatus.java            # Enum: DRAFT, VERIFIED, APPROVED, REJECTED
├── event/
│   ├── BookingConfirmedEvent.java     # Incoming event DTO (จาก Sales & Booking)
│   └── ContractDraftedEvent.java      # Outgoing event DTO (ส่งให้ Service 2)
├── kafka/
│   ├── BookingConfirmedConsumer.java   # Kafka Consumer: booking.confirmed
│   └── ContractDraftedProducer.java   # Kafka Producer: contract-legal.drafted
├── policy/
│   └── KYCVerificationPolicy.java     # Policy ตรวจ KYC status
├── repository/
│   └── ContractRepository.java        # JPA Repository
└── service/
    └── ContractDraftService.java      # Business logic หลัก
```

---

## Payload ที่ Produce (contract.drafted)

| Field       | Type    | คำอธิบาย                          |
|-------------|---------|-----------------------------------|
| contractId  | uuid    | ID ที่ระบบสร้างขึ้นสำหรับสัญญานี้ |
| bookingId   | uuid    | อ้างอิง booking ต้นทาง            |
| unitId      | uuid    | unit ที่ทำสัญญา                   |
| customerId  | uuid    | ลูกค้าผู้ซื้อ                    |
| status      | enum    | "DRAFT"                           |
| fileUrl     | string  | URL ไฟล์สัญญา PDF                 |
| draftedAt   | ISO8601 | เวลาที่สร้างสัญญา                |

---

## เทคโนโลยีที่ใช้

- **Java 21**
- **Spring Boot 3.4.3**
- **Spring Kafka** — Consumer / Producer
- **Spring Data JPA** — Persist contract state
- **H2 Database** — In-memory database (สำหรับ demo)
- **Apache Kafka** — Asynchronous Messaging
- **Jackson** — JSON serialization/deserialization

---

## วิธีการรัน

### ข้อกำหนดเบื้องต้น (Prerequisites)

- Java 21+
- Docker & Docker Compose (สำหรับ Kafka)

### Step 1: เปิด Kafka ด้วย Docker Compose

```bash
cd /path/to/cs621_termproject
docker-compose up -d
```

รอประมาณ 10 วินาทีให้ Kafka พร้อม

### Step 2: รัน Spring Boot Application

```bash
cd kafka-listener
./mvnw spring-boot:run
```

Application จะรันที่ **port 8081** และเริ่ม listen topic `booking.confirmed`

### Step 3: ทดสอบส่ง Event

#### วิธีที่ 1: ผ่าน REST API (แนะนำ)

ส่งแบบ auto-generate UUID:
```bash
curl -X POST http://localhost:8081/api/test/booking-confirmed
```

ส่งแบบระบุ UUID เอง:
```bash
curl -X POST http://localhost:8081/api/test/booking-confirmed \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "unitId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "customerId": "c3d4e5f6-a7b8-9012-cdef-123456789012"
  }'
```

#### วิธีที่ 2: ผ่าน Kafka Console Producer

```bash
docker exec -it cs621_termproject-kafka-1 kafka-console-producer \
  --broker-list localhost:9092 \
  --topic booking.confirmed
```

แล้วพิมพ์ JSON (ต้องอยู่ในบรรทัดเดียว ห้ามมี space แทรก):
```json
{"bookingId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","unitId":"b2c3d4e5-f6a7-8901-bcde-f12345678901","customerId":"c3d4e5f6-a7b8-9012-cdef-123456789012"}
```

---

## วิธีดูผลลัพธ์

### ดู Event ที่ Produce ไปยัง topic `contract-legal.drafted`

```bash
docker exec -it cs621_termproject-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic contract-legal.drafted \
  --from-beginning
```

ตัวอย่าง output:
```json
{
  "contractId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "bookingId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "unitId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "customerId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "status": "DRAFT",
  "fileUrl": "https://storage.realestate.com/contracts/xxxxx.pdf",
  "draftedAt": "2026-04-05T08:29:26.123Z"
}
```

### ดูข้อมูลในฐานข้อมูล H2

1. เปิด browser ไปที่: **http://localhost:8081/h2-console**
2. ตั้งค่า:
   - JDBC URL: `jdbc:h2:mem:contractdb`
   - Username: `sa`
   - Password: *(ว่างไว้)*
3. รัน SQL:
   ```sql
   SELECT * FROM contracts;
   ```

---

## Application Configuration

```properties
spring.application.name=contract-draft-service
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.group-id=contract-draft-service-v4
spring.kafka.consumer.auto-offset-reset=latest
spring.datasource.url=jdbc:h2:mem:contractdb
server.port=8081
```

---

## Flow สรุป

```
1. Sales & Booking ส่ง booking.confirmed event
            ↓
2. BookingConfirmedConsumer รับ event
            ↓
3. KYCVerificationPolicy ตรวจ KYC status
            ↓
4. ContractDraftService สร้าง Contract (status=DRAFT) บันทึกลง DB
            ↓
5. ContractDraftedProducer ส่ง contract.drafted ไปยัง topic contract-legal.drafted
            ↓
6. Service 2 (Title Deed Service) รับไปตรวจสอบโฉนดต่อ
```
