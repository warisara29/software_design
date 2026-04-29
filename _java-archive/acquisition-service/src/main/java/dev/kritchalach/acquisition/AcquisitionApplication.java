package dev.kritchalach.acquisition;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

@SpringBootApplication
public class AcquisitionApplication {

	public static void main(String[] args) {
		SpringApplication.run(AcquisitionApplication.class, args);
	}

	// Consume: property.survey.received-topic (จาก Inventory)
	@Bean
	public NewTopic propertySurveyedTopic() {
		return TopicBuilder.name("property.survey.received-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Consume: acquisition.approval.granted-topic (จาก CEO หลัง approve การซื้อ)
	@Bean
	public NewTopic acquisitionApprovedTopic() {
		return TopicBuilder.name("acquisition.approval.granted-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Produce: acquisition.approval.requested-topic (ส่งให้ CEO)
	@Bean
	public NewTopic acquisitionApprovalRequestedTopic() {
		return TopicBuilder.name("acquisition.approval.requested-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Produce: acquisition.contract.drafted-topic (willing contract — ส่งให้ Inventory เพื่อ register)
	@Bean
	public NewTopic acquisitionContractDraftedTopic() {
		return TopicBuilder.name("acquisition.contract.drafted-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}
}
