export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Property Acquisition Service',
    version: '1.0.0',
    description:
      'Contract & Legal team — Flow 1 (Acquire Property). Manages property acquisitions: surveyed → CEO approval → willing contract drafted. Uses Kafka + REST fallback.',
  },
  servers: [
    { url: 'https://acquisition-service.onrender.com', description: 'Production (Render)' },
    { url: 'http://localhost:8082', description: 'Local dev' },
  ],
  tags: [
    { name: 'Health', description: 'Service liveness probe' },
    { name: 'Query', description: 'Read acquisitions (REST GET)' },
    { name: 'Inbound (REST fallback)', description: 'POST endpoints that mirror Kafka subscribe events' },
    { name: 'Test (Kafka simulator)', description: 'Publishes to Kafka' },
    { name: 'Debug', description: 'Smoke tests + DB seeding' },
  ],
  components: {
    schemas: {
      AcquisitionStatus: {
        type: 'string',
        enum: ['SURVEYED', 'APPROVAL_REQUESTED', 'APPROVED', 'CONTRACT_DRAFTED', 'REJECTED'],
      },
      AcquisitionView: {
        type: 'object',
        properties: {
          acquisitionId: { type: 'string', format: 'uuid' },
          status: { $ref: '#/components/schemas/AcquisitionStatus' },
          surveyId: { type: 'string', format: 'uuid' },
          propertyId: { type: 'string', format: 'uuid' },
          address: { type: 'string', nullable: true },
          areaSqm: { type: 'number', nullable: true },
          estimatedValue: { type: 'number', nullable: true },
          zoneType: { type: 'string', nullable: true },
          sellerId: { type: 'string', format: 'uuid', nullable: true },
          sellerName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          approvedAt: { type: 'string', format: 'date-time', nullable: true },
          willingContract: {
            type: 'object',
            nullable: true,
            properties: {
              willingContractId: { type: 'string', format: 'uuid' },
              fileUrl: { type: 'string' },
              agreedPrice: { type: 'number' },
              templateId: { type: 'string', format: 'uuid' },
              draftedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      PropertySurveyedEvent: {
        type: 'object',
        required: ['surveyId', 'propertyId'],
        properties: {
          surveyId: { type: 'string', format: 'uuid' },
          propertyId: { type: 'string', format: 'uuid' },
          address: { type: 'string' },
          areaSqm: { type: 'number' },
          estimatedValue: { type: 'number' },
          zoneType: { type: 'string', example: 'RESIDENTIAL' },
          sellerId: { type: 'string', format: 'uuid' },
          sellerName: { type: 'string' },
          sellerContact: { type: 'string' },
        },
      },
      AcquisitionApprovedEvent: {
        type: 'object',
        required: ['acquisitionId'],
        properties: {
          acquisitionId: { type: 'string', format: 'uuid' },
          approvedPrice: { type: 'number' },
          approvedBy: { type: 'string' },
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
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'UP' } },
      },
    },
    '/api/acquisitions/{id}': {
      get: {
        tags: ['Query'],
        summary: 'Get acquisition by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/AcquisitionView' } } } },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/acquisitions': {
      get: {
        tags: ['Query'],
        summary: 'List acquisitions (optionally filter by status)',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { $ref: '#/components/schemas/AcquisitionStatus' },
          },
        ],
        responses: {
          200: {
            description: 'List of acquisitions',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AcquisitionView' } } } },
          },
          400: { description: 'Invalid status' },
        },
      },
    },
    '/api/inbound/property-surveyed': {
      post: {
        tags: ['Inbound (REST fallback)'],
        summary: 'Receive property survey (REST fallback for property.survey.received)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PropertySurveyedEvent' } } },
        },
        responses: { 200: { description: 'Acquisition opened + approval requested' } },
      },
    },
    '/api/inbound/acquisition-approved': {
      post: {
        tags: ['Inbound (REST fallback)'],
        summary: 'CEO grants approval (REST fallback for acquisition.approval.granted)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AcquisitionApprovedEvent' } } },
        },
        responses: { 200: { description: 'Willing contract drafted' } },
      },
    },
    '/api/test/property-surveyed': {
      post: {
        tags: ['Test (Kafka simulator)'],
        summary: 'Publish property.survey.received to Kafka',
        responses: { 200: { description: 'Event sent' } },
      },
    },
    '/api/test/acquisition-approved': {
      post: {
        tags: ['Test (Kafka simulator)'],
        summary: 'Publish acquisition.approval.granted to Kafka',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AcquisitionApprovedEvent' } } },
        },
        responses: { 200: { description: 'Event sent' } },
      },
    },
    '/api/debug/seed': {
      post: {
        tags: ['Debug'],
        summary: 'Seed 4 sample acquisitions covering all states',
        responses: { 200: { description: 'Seeded' } },
      },
    },
    '/api/debug/kafka-ping': {
      post: {
        tags: ['Debug'],
        summary: 'Smoke test Kafka connectivity',
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};
