package com.campus.lostfound.dto;

public class ApproveClaimRequest {
    private String reviewNote;

    public ApproveClaimRequest() {
    }

    public ApproveClaimRequest(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }
}
