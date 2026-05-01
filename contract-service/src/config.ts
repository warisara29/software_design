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
    bookingConfirmed: 'booking.order.confirmed',
    // Flow 2 event 6: Legal ร่างสัญญาจะซื้อจะขาย (preliminary willing-to-buy)
    willingContractDrafted: 'willing.contract.drafted',
    // Flow 2 event 8: Legal ตรวจ property + lease
    propertyLeaseInspected: 'property.lease.inspected',
    // Flow 2 event 9: Legal ร่างสัญญาซื้อขายจริง (เดิมชื่อ contract.draft.created)
    purchaseContractDrafted: 'contract.drafted',
  },
};
