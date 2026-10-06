package com.campus.lostfound.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestRbacController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> publicEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Public endpoint accessible by all"));
    }

    @GetMapping("/authenticated")
    public ResponseEntity<Map<String, String>> authenticatedEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Authenticated access successful"));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminOnlyEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Admin access authorized"));
    }

    @GetMapping("/security")
    @PreAuthorize("hasAnyRole('SECURITY', 'ADMIN')")
    public ResponseEntity<Map<String, String>> securityEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Security access authorized"));
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, String>> studentOnlyEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Student access authorized"));
    }
}
