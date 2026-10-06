package com.campus.lostfound.dto;

import jakarta.validation.constraints.Size;

public class RejectClaimRequest {

    @Size(max = 1000, message = "Review note cannot exceed 1000 characters")
    private String reviewNote;

    public RejectClaimRequest() {
    }

    public RejectClaimRequest(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }
}
