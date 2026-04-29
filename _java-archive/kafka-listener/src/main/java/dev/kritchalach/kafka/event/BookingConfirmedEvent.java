package dev.kritchalach.kafka.event;

public class BookingConfirmedEvent {

    private String bookingId;
    private String unitId;
    private String customerId;

    public BookingConfirmedEvent() {}

    public BookingConfirmedEvent(String bookingId, String unitId, String customerId) {
        this.bookingId = bookingId;
        this.unitId = unitId;
        this.customerId = customerId;
    }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    public String getUnitId() { return unitId; }
    public void setUnitId(String unitId) { this.unitId = unitId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
}
