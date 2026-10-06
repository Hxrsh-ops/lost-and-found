package com.campus.lostfound.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    record StoredFile(String storageKey, String publicUrl, String mimeType, long fileSize) {}

    StoredFile store(MultipartFile file, String subDirectory);

    Resource loadAsResource(String storageKey);

    void delete(String storageKey);
}
