package com.campus.lostfound.controller;

import com.campus.lostfound.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final FileStorageService fileStorageService;

    public ImageController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> serveImage(HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        String prefix = "/api/images/";
        int index = fullPath.indexOf(prefix);
        String storageKey = (index >= 0) ? fullPath.substring(index + prefix.length()) : fullPath;

        Resource file = fileStorageService.loadAsResource(storageKey);

        String contentType = null;
        try {
            contentType = Files.probeContentType(Paths.get(file.getURI()));
        } catch (IOException ignored) {}

        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(file);
    }
}
