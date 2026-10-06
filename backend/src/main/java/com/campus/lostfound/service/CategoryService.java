package com.campus.lostfound.service;

import com.campus.lostfound.dto.category.CategoryDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getActiveCategories();
}
