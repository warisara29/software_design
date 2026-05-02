export const config = {
  serviceName: 'property-acquisition-service',
  port: Number(process.env.PORT ?? 8082),
  kafka: {
    clientId: 'property-acquisition-service',
    groupId: 'property-acquisition-service',
    brokers: (process.env.KAFKA_BROKERS ?? process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
    securityProtocol:
      process.env.KAFKA_SSL === 'true'
        ? 'SASL_SSL'
        : (process.env.KAFKA_SECURITY_PROTOCOL ?? 'PLAINTEXT'),
    saslMechanism: 'plain' as const,
    saslUsername: process.env.KAFKA_USERNAME ?? process.env.KAFKA_API_KEY,
    saslPassword: process.env.KAFKA_PASSWORD ?? process.env.KAFKA_API_SECRET,
  },
  topics: {
    // Flow 1 trigger — CEO publishes after property survey complete (was: property.survey.received)
    propertySurveyed: 'ceo.property.survey.completed',
    acquisitionApprovalRequested: 'acquisition.approval.requested',
    acquisitionApproved: 'acquisition.approval.granted',
    acquisitionContractDrafted: 'acquisition.contract.drafted',
    // Flow 1 event 2 — Legal+Inventory ตรวจสอบ property เสร็จ → CEO subscribe
    propertyInspected: 'property.inspected',
  },
};
