package com.campus.lostfound.service.impl;

import com.campus.lostfound.exception.ApiException;
import com.campus.lostfound.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageServiceImpl.class);

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final Path rootLocation;

    public LocalStorageServiceImpl(@Value("${app.storage.local.upload-dir:./uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Initialized local file storage at: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory at " + rootLocation, e);
        }
    }

    @Override
    public StoredFile store(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Cannot upload an empty file", HttpStatus.BAD_REQUEST) {};
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException("File size exceeds the 10MB limit", HttpStatus.BAD_REQUEST) {};
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException("Invalid file type. Allowed formats: JPG, PNG, WEBP", HttpStatus.BAD_REQUEST) {};
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID() + extension;

        try {
            Path targetDir = rootLocation;
            if (StringUtils.hasText(subDirectory)) {
                targetDir = rootLocation.resolve(subDirectory).normalize();
                if (!targetDir.startsWith(rootLocation)) {
                    throw new ApiException("Invalid storage subdirectory path", HttpStatus.BAD_REQUEST) {};
                }
                Files.createDirectories(targetDir);
            }

            Path destinationFile = targetDir.resolve(filename).normalize();
            if (!destinationFile.startsWith(rootLocation)) {
                throw new ApiException("Invalid storage destination path", HttpStatus.BAD_REQUEST) {};
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            String storageKey = (StringUtils.hasText(subDirectory) ? subDirectory + "/" : "") + filename;
            String publicUrl = "/api/images/" + storageKey;

            log.info("Saved image to storage key: {}", storageKey);
            return new StoredFile(storageKey, publicUrl, contentType, file.getSize());

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new ApiException("Failed to save uploaded file", HttpStatus.INTERNAL_SERVER_ERROR) {};
        }
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        try {
            Path file = rootLocation.resolve(storageKey).normalize();
            if (!file.startsWith(rootLocation)) {
                throw new ApiException("Invalid image access path", HttpStatus.BAD_REQUEST) {};
            }

            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ApiException("Image file not found", HttpStatus.NOT_FOUND) {};
            }
        } catch (MalformedURLException e) {
            throw new ApiException("Could not read image resource", HttpStatus.NOT_FOUND) {};
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path file = rootLocation.resolve(storageKey).normalize();
            if (file.startsWith(rootLocation)) {
                Files.deleteIfExists(file);
                log.info("Deleted image from storage: {}", storageKey);
            }
        } catch (IOException e) {
            log.warn("Failed to delete file from storage: {}", storageKey, e);
        }
    }

    private String getExtension(String originalFilename, String contentType) {
        if (StringUtils.hasText(originalFilename) && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (List.of(".jpg", ".jpeg", ".png", ".webp").contains(ext)) {
                return ext;
            }
        }
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
