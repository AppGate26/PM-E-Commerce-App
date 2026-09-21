package com.appGate.inventory.dto;

import com.appGate.inventory.models.Category;
import com.appGate.inventory.models.SubCategory;
import lombok.Data;

import java.util.List;

@Data
public class SubCategoryDto {

    private String name;
    private String description;
    private Long categoryId;
}
