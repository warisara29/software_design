import { Kafka, logLevel, type SASLOptions } from 'kafkajs';
import { config } from '../config.js';

const useSasl =
  config.kafka.securityProtocol === 'SASL_SSL' &&
  Boolean(config.kafka.saslUsername) &&
  Boolean(config.kafka.saslPassword);

const sasl: SASLOptions | undefined = useSasl
  ? {
      mechanism: config.kafka.saslMechanism,
      username: config.kafka.saslUsername!,
      password: config.kafka.saslPassword!,
    }
  : undefined;

export const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  ssl: config.kafka.securityProtocol === 'SASL_SSL',
  sasl,
  logLevel: logLevel.INFO,
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: config.kafka.groupId });
