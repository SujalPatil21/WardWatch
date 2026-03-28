package com.wardwatch.dto;

public class AlertDTO {

    private String type;    // DISCHARGE_DELAY | CLEANING_DELAY | CAPACITY_RISK
    private String message; // Short, human-readable alert text

    public AlertDTO(String type, String message) {
        this.type = type;
        this.message = message;
    }

    public String getType()    { return type; }
    public String getMessage() { return message; }
}
