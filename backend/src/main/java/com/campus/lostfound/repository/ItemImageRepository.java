package com.campus.lostfound.repository;

import com.campus.lostfound.entity.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemImageRepository extends JpaRepository<ItemImage, UUID> {

    List<ItemImage> findByItemIdOrderBySortOrderAsc(UUID itemId);

    List<ItemImage> findByItemIdOrderBySortOrderAscCreatedAtAsc(UUID itemId);
}
