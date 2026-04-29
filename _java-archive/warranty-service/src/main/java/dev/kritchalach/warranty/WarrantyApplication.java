package dev.kritchalach.warranty;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

@SpringBootApplication
public class WarrantyApplication {

	public static void main(String[] args) {
		SpringApplication.run(WarrantyApplication.class, args);
	}

	// Consume: warranty.defect.reported-topic (จาก Post-sale)
	@Bean
	public NewTopic defectReportedTopic() {
		return TopicBuilder.name("warranty.defect.reported-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Consume: warranty.coverage.registered-topic (Post-sale แจ้งว่ามีการลงทะเบียน warranty หลังส่งมอบ)
	@Bean
	public NewTopic warrantyRegisteredTopic() {
		return TopicBuilder.name("warranty.coverage.registered-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}

	// Produce: warranty.coverage.verified-topic (ส่งกลับ Post-sale เพื่อนัดซ่อม / แจ้งลูกค้า)
	@Bean
	public NewTopic warrantyVerifiedTopic() {
		return TopicBuilder.name("warranty.coverage.verified-topic")
				.partitions(1)
				.replicas(1)
				.build();
	}
}
