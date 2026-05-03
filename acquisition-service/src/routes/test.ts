import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { producer } from '../kafka/client.js';

export const testRouter = Router();

testRouter.post('/api/test/property-surveyed', async (req, res) => {
  const propertyId = req.body?.propertyId ?? uuidv4();
  const unitId = req.body?.unitId ?? uuidv4();

  // Default to CEO's rich array-of-properties schema; allow body override
  const payload = req.body && Object.keys(req.body).length > 0 && !req.body.useDefault
    ? req.body
    : [
        {
          propertyId,
          propertyDeveloper: 'Sansiri',
          propertyName: 'Project 1',
          propertyType: 'House',
          propertyCode: 'P001',
          location: 'Bangkok',
          city: 'Bangkok',
          propertyAddress:
            '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110 ประเทศไทย',
          currency: 'THB',
          registration: 'Freehold',
          publishDate: [2025, 1, 1],
          createdDtm: 1735700400,
          createdBy: 'system',
          sellerId: 'CUST-AQQ-001',
          unitId,
          unitCode: 'U-001',
          unitArea: 200,
          bedroomType: '3 Bedroom',
          unitAddress:
            'เลขที่ 1201 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110 ประเทศไทย',
          bathrooms: 3,
          view: 'Garden View',
          furniture: 'Fully Furnished',
          facility: 'Pool, Gym',
          pictureUrls: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
            'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
          ],
          cost: 2_200_000,
          minSalePrice: 2_400_000,
          price: 2_700_000,
          saleTeamLead: 'Team A',
          commission: 120_000,
          status: 'RESERVED',
        },
      ];

  await producer.send({
    topic: config.topics.propertySurveyed,
    messages: [{ key: propertyId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.propertySurveyed} event sent`,
    payload,
  });
});

testRouter.post('/api/test/acquisition-approved', async (req, res) => {
  const acquisitionId = req.body?.acquisitionId;
  if (!acquisitionId) {
    res.status(400).json({ error: 'acquisitionId is required' });
    return;
  }
  const approvedPrice = req.body?.approvedPrice ?? 5_500_000;
  const approvedBy = req.body?.approvedBy ?? 'CEO-001';

  const payload = { acquisitionId, approvedPrice, approvedBy };

  await producer.send({
    topic: config.topics.acquisitionApproved,
    messages: [{ key: acquisitionId, value: JSON.stringify(payload) }],
  });

  res.json({
    message: `${config.topics.acquisitionApproved} event sent`,
    acquisitionId,
  });
});
