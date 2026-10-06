package com.campus.lostfound.exception;

import org.springframework.http.HttpStatus;

public class AccountBlockedException extends ApiException {
    public AccountBlockedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }

    public AccountBlockedException() {
        super("Your account has been blocked. Please contact campus security or administration.", HttpStatus.FORBIDDEN);
    }
}
