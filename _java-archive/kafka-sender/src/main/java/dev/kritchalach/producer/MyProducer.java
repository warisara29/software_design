package dev.kritchalach.producer;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyProducer {

	private final KafkaTemplate<String, String> kafkaTemplate;

	public MyProducer(KafkaTemplate<String, String> kafkaTemplate) {
		this.kafkaTemplate = kafkaTemplate;
		this.kafkaTemplate.send("test-topic", "Hello World from My Producer Component");
	}

}
