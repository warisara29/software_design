package dev.kritchalach.acquisition.controller;

import dev.kritchalach.acquisition.domain.AcquisitionStatus;
import dev.kritchalach.acquisition.dto.AcquisitionView;
import dev.kritchalach.acquisition.repository.AcquisitionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/acquisitions")
public class AcquisitionQueryController {

    private final AcquisitionRepository acquisitionRepository;

    public AcquisitionQueryController(AcquisitionRepository acquisitionRepository) {
        this.acquisitionRepository = acquisitionRepository;
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AcquisitionView> getById(@PathVariable("id") UUID id) {
        return acquisitionRepository.findById(id)
                .map(AcquisitionView::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AcquisitionView> list(@RequestParam(value = "status", required = false) AcquisitionStatus status) {
        var rows = (status != null)
                ? acquisitionRepository.findByStatus(status)
                : acquisitionRepository.findAll();
        return rows.stream().map(AcquisitionView::from).toList();
    }
}
