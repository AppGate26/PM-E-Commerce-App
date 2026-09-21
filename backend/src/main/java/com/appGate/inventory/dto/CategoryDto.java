package com.appGate.inventory.dto;

import com.appGate.inventory.models.SubCategory;
import lombok.Data;

import java.util.List;

@Data
public class CategoryDto {

    private String name;
    private String description;
    private List<SubCategory> subCategories;
}
