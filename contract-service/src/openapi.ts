export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Contract Draft Service',
    version: '1.0.0',
    description:
      'Contract & Legal team — Flow 2 (Selling Property). Drafts the purchase contract after a booking is confirmed by Sales. Uses Kafka for inter-service events with REST fallback.',
  },
  servers: [
    { url: 'https://contract-service-h5fs.onrender.com', description: 'Production (Render)' },
    { url: 'http://localhost:8081', description: 'Local dev' },
  ],
  tags: [
    { name: 'Health', description: 'Service liveness probe' },
    { name: 'Query', description: 'Read contracts (REST GET)' },
    { name: 'Inbound (REST fallback)', description: 'POST endpoints that mirror Kafka subscribe events — for when topics are not yet provisioned' },
    { name: 'Test (Kafka simulator)', description: 'Publishes to Kafka; requires the topic to exist on the cluster' },
    { name: 'Debug', description: 'Smoke tests + DB seeding' },
  ],
  components: {
    schemas: {
      ContractView: {
        type: 'object',
        properties: {
          contractId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['DRAFT', 'PENDING_SIGN', 'SIGNED', 'CANCELLED'] },
          bookingId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          buyerId: { type: 'string', format: 'uuid', nullable: true },
          sellerId: { type: 'string', format: 'uuid', nullable: true },
          templateId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          draft: {
            type: 'object',
            nullable: true,
            properties: {
              draftId: { type: 'string', format: 'uuid' },
              fileUrl: { type: 'string' },
              templateId: { type: 'string', format: 'uuid' },
              draftedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      BookingConfirmedEvent: {
        type: 'object',
        required: ['bookingId', 'unitId', 'customerId'],
        description: 'Legacy schema — UUID format. Still accepted by /api/inbound/booking-confirmed for backward compat.',
        properties: {
          bookingId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
        },
      },
      SaleBookedCompleteEvent: {
        type: 'object',
        description: "Sales' actual Kafka event schema (string codes, not UUIDs). Topic: sale.booked.complete",
        required: ['ProjectName', 'PropertyID', 'Customer ID', 'StatusKYC'],
        properties: {
          ProjectName: { type: 'string' },
          'Reservation ID': { type: 'string' },
          ContractID: { type: 'string' },
          PropertyID: { type: 'string', example: 'PROP-001' },
          Location: { type: 'string' },
          'Customer ID': { type: 'string', example: 'CUST-001' },
          'Area unit/layout': { type: 'string' },
          'room type': { type: 'string' },
          'Price per unit': { type: 'number' },
          'room number': { type: 'string' },
          StatusKYC: { type: 'string', enum: ['PASSED', 'PENDING', 'REJECTED'] },
          PaymentSecondStatus: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED'] },
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
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    service: { type: 'string', example: 'contract-draft-service' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/contracts/{id}': {
      get: {
        tags: ['Query'],
        summary: 'Get contract by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ContractView' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/contracts': {
      get: {
        tags: ['Query'],
        summary: 'List contracts',
        parameters: [
          { name: 'customerId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' }, description: 'Filter by customer' },
        ],
        responses: {
          200: {
            description: 'List of contracts',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ContractView' } } } },
          },
        },
      },
    },
    '/api/inbound/booking-confirmed': {
      post: {
        tags: ['Inbound (REST fallback)'],
        summary: 'Trigger contract draft (REST fallback for sale.booked.complete)',
        description:
          'Use this when Kafka topics are not yet provisioned. Accepts BOTH Sales schema (sale.booked.complete) and legacy UUID schema. Persists contract to DB and best-effort publishes downstream events.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/SaleBookedCompleteEvent' },
                  { $ref: '#/components/schemas/BookingConfirmedEvent' },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Contract drafted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    contract: { type: 'object' },
                    kafkaPublishWarnings: { type: 'array', items: { type: 'string' }, nullable: true },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
        },
      },
    },
    '/api/test/booking-confirmed': {
      post: {
        tags: ['Test (Kafka simulator)'],
        summary: 'Publish sale.booked.complete to Kafka (Sales\' schema)',
        description: 'Simulates Sales publishing to sale.booked.complete topic. Body fields override defaults.',
        requestBody: {
          required: false,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SaleBookedCompleteEvent' } } },
        },
        responses: {
          200: { description: 'Event sent' },
          500: { description: 'Kafka publish failed (topic missing?)' },
        },
      },
    },
    '/api/debug/seed': {
      post: {
        tags: ['Debug'],
        summary: 'Seed 3 sample contracts into DB',
        responses: { 200: { description: 'Seeded' } },
      },
    },
    '/api/debug/kafka-ping': {
      post: {
        tags: ['Debug'],
        summary: 'Smoke test Kafka connectivity (publishes to project.release.create)',
        responses: {
          200: { description: 'Auth + network OK' },
          500: { description: 'Kafka publish failed' },
        },
      },
    },
  },
};
