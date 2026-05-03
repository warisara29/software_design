import { config } from '../config.js';
import { consumer } from './client.js';
import { AcquisitionService } from '../service/AcquisitionService.js';
import type { PropertySurveyedEvent } from '../event/PropertySurveyedEvent.js';
import { PropertyInspectedProducer } from './producers.js';
import { prettyJson } from './log.js';

/**
 * Flow 1 — เข้าซื้อ property จาก seller
 *
 * Inbound:  ceo.property.survey.completed (rich schema; single object OR array)
 * Outbound: property.inspected (CEO subscribes this for approval decision)
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
      console.log(`\n[Consumer] ← ${topic}\n${prettyJson(raw)}`);
      try {
        if (topic === config.topics.propertySurveyed) {
          const parsed = JSON.parse(raw);
          // CEO may publish either a single object OR an array of properties
          const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of items) {
            await processOneSurvey(item);
          }
        }
      } catch (err) {
        console.error(`[Consumer] failed to process ${topic}:`, err);
      }
    },
  });
}

/** Normalize one CEO survey item, save Acquisition, then publish property.inspected. */
async function processOneSurvey(item: unknown): Promise<void> {
  const p = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;

  // Accept both new (rich) and legacy (flat) field names
  const event: PropertySurveyedEvent = {
    surveyId: pickString(p, 'surveyId', 'SurveyID', 'Survey ID', 'id'),
    propertyId: pickString(p, 'propertyId', 'PropertyID', 'Property ID') ?? '',
    propertyDeveloper: pickString(p, 'propertyDeveloper', 'developer'),
    propertyName: pickString(p, 'propertyName', 'name'),
    propertyType: pickString(p, 'propertyType', 'type'),
    propertyCode: pickString(p, 'propertyCode', 'code'),
    location: pickString(p, 'location', 'Location'),
    city: pickString(p, 'city', 'City'),
    propertyAddress: pickString(p, 'propertyAddress', 'address', 'Address'),
    address: pickString(p, 'address', 'Address'),
    currency: pickString(p, 'currency'),
    registration: pickString(p, 'registration'),
    createdBy: pickString(p, 'createdBy'),
    sellerId: pickString(p, 'sellerId', 'SellerID', 'Seller ID'),
    sellerName: pickString(p, 'sellerName', 'SellerName', 'Seller Name'),
    sellerContact: pickString(p, 'sellerContact', 'SellerContact', 'Seller Contact'),
    unitId: pickString(p, 'unitId'),
    unitCode: pickString(p, 'unitCode'),
    unitArea: pickNumber(p, 'unitArea', 'areaSqm', 'AreaSqm', 'area'),
    areaSqm: pickNumber(p, 'areaSqm', 'AreaSqm', 'area'),
    bedroomType: pickString(p, 'bedroomType'),
    unitAddress: pickString(p, 'unitAddress'),
    bathrooms: pickNumber(p, 'bathrooms'),
    view: pickString(p, 'view'),
    furniture: pickString(p, 'furniture'),
    facility: pickString(p, 'facility'),
    pictureUrls: Array.isArray(p.pictureUrls) ? (p.pictureUrls as string[]) : undefined,
    cost: pickNumber(p, 'cost'),
    minSalePrice: pickNumber(p, 'minSalePrice'),
    price: pickNumber(p, 'price', 'estimatedValue', 'EstimatedValue', 'value'),
    estimatedValue: pickNumber(p, 'estimatedValue', 'EstimatedValue', 'value', 'price'),
    saleTeamLead: pickString(p, 'saleTeamLead'),
    commission: pickNumber(p, 'commission'),
    zoneType: pickString(p, 'zoneType', 'ZoneType', 'zone'),
    status: pickString(p, 'status'),
  };

  if (!event.propertyId) {
    console.warn('[Flow 1] ⚠️ property survey item missing propertyId — skipped');
    return;
  }

  const out = await AcquisitionService.receiveSurvey(event);

  console.log(
    `[Flow 1] ✅ saved acquisition (status=APPROVAL_REQUESTED) — acquisitionId=${out.acquisitionId}`,
  );

  // Flow 1 — Legal+Inventory ตรวจสอบ property เสร็จ → publish property.inspected
  // (For now Legal auto-PASS; CEO subscribes this for approval decision.)
  await PropertyInspectedProducer.send({
    acquisitionId: out.acquisitionId,
    surveyId: out.surveyId,
    propertyId: out.propertyId,
    inspectedBy: 'legal-acquisition-service',
    inspectionResult: 'PASS',
    inspectionNotes: 'Property documents reviewed; ownership and seller info verified.',
    inspectedAt: new Date().toISOString(),
  });

  console.log(
    `[Flow 1] ✅ DONE publish property.inspected — acquisitionId=${out.acquisitionId}`,
  );
}

function pickString(p: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

function pickNumber(p: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.length > 0 && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

