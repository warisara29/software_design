export const config = {
  serviceName: 'contract-draft-service',
  port: Number(process.env.PORT ?? 8081),
  kafka: {
    clientId: 'contract-draft-service',
    groupId: 'contract-draft-service',
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
    securityProtocol: process.env.KAFKA_SECURITY_PROTOCOL ?? 'PLAINTEXT',
    saslMechanism: 'plain' as const,
    saslUsername: process.env.KAFKA_API_KEY,
    saslPassword: process.env.KAFKA_API_SECRET,
  },
  topics: {
    bookingConfirmed: 'booking.order.confirmed-topic',
    contractDraftCreated: 'contract.draft.created-topic',
  },
};
