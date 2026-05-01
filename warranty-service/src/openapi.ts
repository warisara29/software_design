export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Warranty Verification Service',
    version: '1.0.0',
    description:
      'Contract & Legal team — Flow 4 (Defect Report). Manages warranty coverage and verifies defect claims. Uses Kafka + REST fallback.',
  },
  servers: [
    { url: 'https://warranty-service-gtv0.onrender.com', description: 'Production (Render)' },
    { url: 'http://localhost:8083', description: 'Local dev' },
  ],
  tags: [
    { name: 'Health', description: 'Service liveness probe' },
    { name: 'Query', description: 'Read warranties + claims (REST GET)' },
    { name: 'Inbound (REST fallback)', description: 'POST endpoints that mirror Kafka subscribe events' },
    { name: 'Test (Kafka simulator)', description: 'Publishes to Kafka' },
    { name: 'Debug', description: 'Smoke tests + DB seeding' },
  ],
  components: {
    schemas: {
      DefectCategory: {
        type: 'string',
        enum: ['STRUCTURAL', 'ELECTRICAL', 'PLUMBING', 'FINISHING', 'APPLIANCE', 'OTHER'],
      },
      CoverageStatus: {
        type: 'string',
        enum: ['PENDING', 'COVERED', 'REJECTED'],
      },
      WarrantyClaimView: {
        type: 'object',
        properties: {
          claimId: { type: 'string', format: 'uuid' },
          defectId: { type: 'string', format: 'uuid' },
          defectCategory: { $ref: '#/components/schemas/DefectCategory' },
          description: { type: 'string' },
          reportedAt: { type: 'string', format: 'date-time' },
          coverageStatus: { $ref: '#/components/schemas/CoverageStatus' },
          coverageReason: { type: 'string', nullable: true },
          verifiedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      WarrantyView: {
        type: 'object',
        properties: {
          warrantyId: { type: 'string', format: 'uuid' },
          contractId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          coverageStartsAt: { type: 'string', format: 'date-time' },
          coverageEndsAt: { type: 'string', format: 'date-time' },
          coveredCategories: { type: 'array', items: { $ref: '#/components/schemas/DefectCategory' } },
          registeredAt: { type: 'string', format: 'date-time' },
          claims: { type: 'array', items: { $ref: '#/components/schemas/WarrantyClaimView' } },
        },
      },
      WarrantyRegisteredEvent: {
        type: 'object',
        required: ['contractId', 'unitId', 'customerId', 'startsAt', 'endsAt'],
        properties: {
          contractId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          coveredCategories: { type: 'array', items: { $ref: '#/components/schemas/DefectCategory' } },
        },
      },
      DefectReportedEvent: {
        type: 'object',
        required: ['defectId', 'contractId', 'unitId', 'customerId', 'defectCategory'],
        properties: {
          defectId: { type: 'string', format: 'uuid' },
          contractId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          defectCategory: { $ref: '#/components/schemas/DefectCategory' },
          description: { type: 'string' },
          reportedAt: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/health': {
      get: { tags: ['Health'], summary: 'Health check', responses: { 200: { description: 'UP' } } },
    },
    '/api/warranties/{contractId}': {
      get: {
        tags: ['Query'],
        summary: 'Get warranty by contract ID',
        parameters: [
          { name: 'contractId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/WarrantyView' } } } },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/warranties/{warrantyId}/claims': {
      get: {
        tags: ['Query'],
        summary: 'List claims for a warranty',
        parameters: [
          { name: 'warrantyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'List of claims', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/WarrantyClaimView' } } } } },
          404: { description: 'Warranty not found' },
        },
      },
    },
    '/api/inbound/warranty-registered': {
      post: {
        tags: ['Inbound (REST fallback)'],
        summary: 'Register warranty (REST fallback for warranty.coverage.registered-topic)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WarrantyRegisteredEvent' } } },
        },
        responses: { 200: { description: 'Warranty registered' } },
      },
    },
    '/api/inbound/defect-reported': {
      post: {
        tags: ['Inbound (REST fallback)'],
        summary: 'Report defect (REST fallback for warranty.defect.reported-topic)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DefectReportedEvent' } } },
        },
        responses: { 200: { description: 'Claim verified' } },
      },
    },
    '/api/test/warranty-registered': {
      post: {
        tags: ['Test (Kafka simulator)'],
        summary: 'Publish warranty.coverage.registered-topic to Kafka',
        responses: { 200: { description: 'Event sent' } },
      },
    },
    '/api/test/defect-reported': {
      post: {
        tags: ['Test (Kafka simulator)'],
        summary: 'Publish warranty.defect.reported-topic to Kafka',
        responses: { 200: { description: 'Event sent' } },
      },
    },
    '/api/debug/seed': {
      post: { tags: ['Debug'], summary: 'Seed 3 sample warranties with claims', responses: { 200: { description: 'Seeded' } } },
    },
    '/api/debug/kafka-ping': {
      post: { tags: ['Debug'], summary: 'Smoke test Kafka connectivity', responses: { 200: { description: 'OK' } } },
    },
  },
};
