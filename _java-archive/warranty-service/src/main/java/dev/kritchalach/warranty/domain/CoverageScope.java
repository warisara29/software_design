package dev.kritchalach.warranty.domain;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;

import java.util.HashSet;
import java.util.Set;

/**
 * Value Object: CoverageScope
 * รายการ DefectCategory ที่ warranty ครอบคลุม
 */
@Embeddable
public class CoverageScope {

    @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @CollectionTable(name = "warranty_coverage_scope",
            joinColumns = @JoinColumn(name = "warranty_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Set<DefectCategory> categories = new HashSet<>();

    protected CoverageScope() {}

    public CoverageScope(Set<DefectCategory> categories) {
        if (categories == null || categories.isEmpty()) {
            throw new IllegalArgumentException("CoverageScope requires at least one category");
        }
        this.categories = new HashSet<>(categories);
    }

    public boolean includes(DefectCategory category) {
        return categories.contains(category);
    }

    public Set<DefectCategory> getCategories() {
        return Set.copyOf(categories);
    }
}
