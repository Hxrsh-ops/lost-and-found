package com.campus.lostfound.service;

import com.campus.lostfound.dto.common.PageResponse;
import com.campus.lostfound.dto.item.CreateItemRequest;
import com.campus.lostfound.dto.item.ItemDetailDto;
import com.campus.lostfound.dto.item.ItemImageDto;
import com.campus.lostfound.dto.item.ItemSummaryDto;
import com.campus.lostfound.dto.item.UpdateItemRequest;
import com.campus.lostfound.entity.ItemStatus;
import com.campus.lostfound.entity.ItemType;
import com.campus.lostfound.security.UserPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

public interface ItemService {

    ItemDetailDto createItem(CreateItemRequest request, UserPrincipal principal);

    ItemDetailDto getItemById(UUID itemId, UserPrincipal principal);

    PageResponse<ItemSummaryDto> getItems(String search, ItemType type, UUID categoryId,
                                          UUID locationZoneId, ItemStatus status,
                                          Instant from, Instant to, String sort,
                                          int page, int size);

    PageResponse<ItemSummaryDto> getMyItems(UserPrincipal principal, ItemType type,
                                            ItemStatus status, String sort,
                                            int page, int size);

    ItemDetailDto updateItem(UUID itemId, UpdateItemRequest request, UserPrincipal principal);

    ItemImageDto uploadItemImage(UUID itemId, MultipartFile file, UserPrincipal principal);

    void deleteItemImage(UUID itemId, UUID imageId, UserPrincipal principal);
}
