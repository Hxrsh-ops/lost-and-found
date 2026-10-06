package com.campus.lostfound.controller;

import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.CreateItemRequest;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemImageDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.dto.item.UpdateItemRequest;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import com.campus.lostfound.security.UserPrincipal;
import com.campus.lostfound.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping
    public ResponseEntity<ItemDetailDto> createItem(@Valid @RequestBody CreateItemRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        ItemDetailDto item = itemService.createItem(request, principal);
        return new ResponseEntity<>(item, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ItemSummaryDto>> getItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID locationZoneId,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<ItemSummaryDto> items = itemService.getItems(search, type, categoryId, locationZoneId, status, from, to, sort, page, size);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<ItemSummaryDto>> getMyItems(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<ItemSummaryDto> myItems = itemService.getMyItems(principal, type, status, sort, page, size);
        return ResponseEntity.ok(myItems);
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ItemDetailDto> getItemById(@PathVariable UUID itemId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        ItemDetailDto item = itemService.getItemById(itemId, principal);
        return ResponseEntity.ok(item);
    }

    @PatchMapping("/{itemId}")
    public ResponseEntity<ItemDetailDto> updateItem(@PathVariable UUID itemId,
                                                    @Valid @RequestBody UpdateItemRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        ItemDetailDto updated = itemService.updateItem(itemId, request, principal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping(value = "/{itemId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ItemImageDto> uploadImage(@PathVariable UUID itemId,
                                                    @RequestParam("file") MultipartFile file,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        ItemImageDto imageDto = itemService.uploadItemImage(itemId, file, principal);
        return new ResponseEntity<>(imageDto, HttpStatus.CREATED);
    }

    @DeleteMapping("/{itemId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID itemId,
                                            @PathVariable UUID imageId,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        itemService.deleteItemImage(itemId, imageId, principal);
        return ResponseEntity.noContent().build();
    }
}
