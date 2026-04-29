export const config = {
  serviceName: 'property-acquisition-service',
  port: Number(process.env.PORT ?? 8082),
  kafka: {
    clientId: 'property-acquisition-service',
    groupId: 'property-acquisition-service',
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
    securityProtocol: process.env.KAFKA_SECURITY_PROTOCOL ?? 'PLAINTEXT',
    saslMechanism: 'plain' as const,
    saslUsername: process.env.KAFKA_API_KEY,
    saslPassword: process.env.KAFKA_API_SECRET,
  },
  topics: {
    propertySurveyed: 'property.survey.received-topic',
    acquisitionApprovalRequested: 'acquisition.approval.requested-topic',
    acquisitionApproved: 'acquisition.approval.granted-topic',
    acquisitionContractDrafted: 'acquisition.contract.drafted-topic',
  },
};
