package dev.kritchalach.kafka.service;

import dev.kritchalach.kafka.domain.Contract;
import dev.kritchalach.kafka.domain.ContractParties;
import dev.kritchalach.kafka.event.BookingConfirmedEvent;
import dev.kritchalach.kafka.event.ContractDraftCreatedEvent;
import dev.kritchalach.kafka.repository.ContractRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Application Service สำหรับ Command: CreateContractDraft
 * รับ BookingConfirmedEvent → สร้าง Contract aggregate → emit ContractDraftCreated
 */
@Service
public class ContractDraftService {

    private static final Logger log = LoggerFactory.getLogger(ContractDraftService.class);

    private final ContractRepository contractRepository;

    public ContractDraftService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public ContractDraftCreatedEvent createContractDraft(BookingConfirmedEvent event) {
        UUID bookingId = UUID.fromString(event.getBookingId().replaceAll("\\s+", ""));
        UUID unitId = UUID.fromString(event.getUnitId().replaceAll("\\s+", ""));
        UUID customerId = UUID.fromString(event.getCustomerId().replaceAll("\\s+", ""));

        log.info("Command: CreateContractDraft — bookingId={}, unitId={}, customerId={}",
                bookingId, unitId, customerId);

        // สร้าง Value Objects
        UUID sellerId = UUID.randomUUID();
        ContractParties parties = new ContractParties(customerId, sellerId);

        // สร้าง Contract Aggregate ผ่าน factory method (Command pattern)
        UUID templateId = UUID.randomUUID(); // simulate template selection
        String fileUrl = "https://storage.realestate.com/contracts/draft-" + UUID.randomUUID() + ".pdf";

        Contract contract = Contract.createContractDraft(
                bookingId, customerId, unitId, templateId, parties, fileUrl);
        contract = contractRepository.save(contract);

        log.info("ContractDraftCreated: contractId={}, status=DRAFT", contract.getContractId());

        // สร้าง Domain Event: ContractDraftCreated
        return new ContractDraftCreatedEvent(
                contract.getContractId(),
                contract.getBookingId(),
                contract.getUnitId(),
                contract.getCustomerId(),
                contract.getStatus().name(),
                contract.getContractDraft().getFileUrl(),
                contract.getTemplateId(),
                contract.getCreatedAt(),
                contract.getContractDraft().getDraftedAt()
        );
    }
}
