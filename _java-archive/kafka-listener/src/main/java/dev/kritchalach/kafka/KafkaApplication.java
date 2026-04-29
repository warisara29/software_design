package dev.kritchalach.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

@SpringBootApplication
public class KafkaApplication {

	public static void main(String[] args) {
		SpringApplication.run(KafkaApplication.class, args);
	}

	// Consume: booking.order.confirmed-topic (จาก Sales & Booking)
	@Bean
	public NewTopic bookingConfirmedTopic() {
		return TopicBuilder.name("booking.order.confirmed-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Produce: contract.draft.created-topic (ส่งให้ Property Verification)
	@Bean
	public NewTopic contractDraftCreatedTopic() {
		return TopicBuilder.name("contract.draft.created-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}
}
