export const config = {
  serviceName: 'warranty-verification-service',
  port: Number(process.env.PORT ?? 8083),
  kafka: {
    clientId: 'warranty-verification-service',
    groupId: 'warranty-verification-service',
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:9092').split(','),
    securityProtocol: process.env.KAFKA_SECURITY_PROTOCOL ?? 'PLAINTEXT',
    saslMechanism: 'plain' as const,
    saslUsername: process.env.KAFKA_API_KEY,
    saslPassword: process.env.KAFKA_API_SECRET,
  },
  topics: {
    warrantyRegistered: 'warranty.coverage.registered-topic',
    defectReported: 'warranty.defect.reported-topic',
    warrantyVerified: 'warranty.coverage.verified-topic',
    // Flow 4 event 5 — Post-sale ปิด defect case แล้ว Legal subscribe เพื่อ archive ในระบบ
    caseClosed: 'case.closed-topic',
  },
};
