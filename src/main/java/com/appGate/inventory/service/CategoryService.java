package com.appGate.inventory.service;

import com.appGate.inventory.models.Category;
import com.appGate.inventory.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.appGate.inventory.dto.CategoryDto;
import com.appGate.inventory.response.BaseResponse;

import org.modelmapper.ModelMapper;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    
    public BaseResponse createCategory(CategoryDto categoryDto){

        ModelMapper modelMapper = new ModelMapper();
        Category category = modelMapper.map(categoryDto, Category.class);

        Category newCategory = categoryRepository.save(category);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", newCategory);
    }

    public BaseResponse getAllCategories() {
        List<Category> categories = categoryRepository.findAll();

        return new BaseResponse(HttpStatus.OK.value(), "successful", categories);
    }

    public BaseResponse getCategory(Long id) {

        Category category = getOneCategory(id);

        return new BaseResponse(HttpStatus.OK.value(), "successful", category);
    }

    public BaseResponse updateCategory(Long id, CategoryDto categoryDto) {

        Category category = getOneCategory(id);

        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());
        categoryRepository.save(category);

        return new BaseResponse(HttpStatus.OK.value(), "successful", getOneCategory(id));

    }

    private Category getOneCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id"));
    }

    public BaseResponse deleteCategory(Long id) {
        Category category = getOneCategory(id);
        categoryRepository.delete(category);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Category deleted");
    }
}
