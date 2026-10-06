package com.campus.lostfound.repository;

import com.campus.lostfound.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByName(String name);

    List<Category> findByActiveTrueOrderByNameAsc();

    boolean existsByName(String name);
}
