package com.appGate.inventory.service;

import com.appGate.inventory.dto.SubCategoryDto;
import com.appGate.inventory.models.Category;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.SubCategory;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.repository.CategoryRepository;
import com.appGate.inventory.repository.SubCategoryRepository;
import com.appGate.inventory.response.BaseResponse;

import java.util.ArrayList;
import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubCategoryService {

    private final SubCategoryRepository subCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public SubCategoryService(SubCategoryRepository subCategoryRepository, CategoryRepository categoryRepository,
            ProductRepository productRepository) {
        this.productRepository = productRepository;
        this.subCategoryRepository = subCategoryRepository;
        this.categoryRepository = categoryRepository;

    }

    public BaseResponse createSubCategory(SubCategoryDto subCategoryDto) {

        Category category = categoryRepository.findById(subCategoryDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id"));

        SubCategory subCategory = new SubCategory();
        subCategory.setName(subCategoryDto.getName());
        subCategory.setDescription(subCategoryDto.getDescription());
        subCategory.setCategory(category);

        SubCategory newSubCategory = subCategoryRepository.save(subCategory);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", newSubCategory);
    }

    public BaseResponse getAllSubCategories() {
        List<SubCategory> subCategories = subCategoryRepository.findAll();

        return new BaseResponse(HttpStatus.OK.value(), "successful", subCategories);
    }

    public BaseResponse getSubCategory(Long id) {

        SubCategory subCategory = getOneSubCategory(id);

        return new BaseResponse(HttpStatus.OK.value(), "successful", subCategory);
    }

    public BaseResponse updateSubCategory(Long id, SubCategoryDto subCategoryDto) {

        Category category = categoryRepository.findById(subCategoryDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id"));

        SubCategory subCategory = getOneSubCategory(id);

        subCategory.setName(subCategoryDto.getName());
        subCategory.setDescription(subCategoryDto.getDescription());
        subCategory.setCategory(category);

        subCategoryRepository.save(subCategory);

        return new BaseResponse(HttpStatus.OK.value(), "successful", getOneSubCategory(id));

    }

    private SubCategory getOneSubCategory(Long id) {
        return subCategoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id"));
    }

    public BaseResponse getProductsBySubCategory(Long subCategoryId) {

        List<Product> products = productRepository.findBySubCategoryId(subCategoryId);

        return new BaseResponse(HttpStatus.OK.value(), "successful", products);
    }

    public BaseResponse deleteSubCategory(Long id) {
        SubCategory subCategory = getOneSubCategory(id);
        subCategoryRepository.delete(subCategory);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "SubCategory deleted");
    }

    public BaseResponse getSubCategoriesByCategory(Long categoryId) {
        List<SubCategory> subCategories = subCategoryRepository.findByCategoryId(categoryId);

        return new BaseResponse(HttpStatus.OK.value(), "successful", subCategories);
    }
}
