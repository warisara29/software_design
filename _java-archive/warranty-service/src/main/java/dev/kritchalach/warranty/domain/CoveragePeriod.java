package dev.kritchalach.warranty.domain;

import jakarta.persistence.Embeddable;
import java.time.Instant;

/**
 * Value Object: CoveragePeriod
 * ช่วงเวลาคุ้มครอง warranty (start, end) immutable
 */
@Embeddable
public class CoveragePeriod {

    private Instant startsAt;
    private Instant endsAt;

    protected CoveragePeriod() {}

    public CoveragePeriod(Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null) {
            throw new IllegalArgumentException("CoveragePeriod requires both startsAt and endsAt");
        }
        if (!endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException("endsAt must be after startsAt");
        }
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public boolean covers(Instant moment) {
        return !moment.isBefore(startsAt) && !moment.isAfter(endsAt);
    }

    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
}
