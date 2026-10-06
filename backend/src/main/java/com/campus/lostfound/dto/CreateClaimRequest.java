package com.campus.lostfound.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateClaimRequest {

    @NotBlank(message = "Verification answer is required")
    @Size(min = 1, max = 2000, message = "Answer must be between 1 and 2000 characters")
    private String answer;

    public CreateClaimRequest() {
    }

    public CreateClaimRequest(String answer) {
        this.answer = answer;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}
