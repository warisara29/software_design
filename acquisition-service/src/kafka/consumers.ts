import { config } from '../config.js';
import { consumer } from './client.js';
import {
  AcquisitionService,
  type PropertySurveyedEvent,
} from '../service/AcquisitionService.js';

/**
 * Flow 1 (simplified) — เข้าซื้อ property จาก seller
 *
 * Legal subscribe: ceo.property.survey.completed
 *   → บันทึก Acquisition aggregate ใน DB เท่านั้น
 *   → ไม่ publish event ออก (CEO approval cycle ตัดออกแล้ว)
 *   → Willing contract drafting ไปทำต่อใน Flow 2 ผ่าน sale.booked.complete (Sales)
 */
export async function startConsumers(): Promise<void> {
  try {
    await consumer.subscribe({ topic: config.topics.propertySurveyed, fromBeginning: false });
  } catch (err) {
    console.warn(
      `[Kafka] Consumer subscription failed — topic may not exist yet. Service keeps running, REST API works.`,
      (err as Error).message,
    );
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const raw = message.value?.toString() ?? '';
      console.log(`[Consumer] ← ${topic}: ${raw}`);
      try {
        if (topic === config.topics.propertySurveyed) {
          const parsed = JSON.parse(raw);
          // CEO might use different field-name conventions — normalize to our schema
          const event: PropertySurveyedEvent = {
            surveyId: parsed.surveyId ?? parsed.SurveyID ?? parsed['Survey ID'] ?? parsed.id ?? '',
            propertyId: parsed.propertyId ?? parsed.PropertyID ?? parsed['Property ID'] ?? '',
            address: parsed.address ?? parsed.Address ?? parsed.Location ?? '',
            areaSqm: Number(parsed.areaSqm ?? parsed.AreaSqm ?? parsed.area ?? 0),
            estimatedValue: Number(parsed.estimatedValue ?? parsed.EstimatedValue ?? parsed.value ?? parsed.price ?? 0),
            zoneType: parsed.zoneType ?? parsed.ZoneType ?? parsed.zone ?? '',
            sellerId: parsed.sellerId ?? parsed.SellerID ?? parsed['Seller ID'],
            sellerName: parsed.sellerName ?? parsed.SellerName ?? parsed['Seller Name'] ?? '',
            sellerContact: parsed.sellerContact ?? parsed.SellerContact ?? parsed['Seller Contact'] ?? '',
          };

          const out = await AcquisitionService.receiveSurvey(event);

          console.log(
            `[Flow 1] ✅ consume ${config.topics.propertySurveyed} → saved acquisition (status=APPROVAL_REQUESTED) — acquisitionId=${out.acquisitionId}`,
          );
          console.log(
            `[Flow 1] ℹ️  willing contract จะถูก draft ใน Flow 2 เมื่อได้รับ sale.booked.complete จาก Sales`,
          );
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}
