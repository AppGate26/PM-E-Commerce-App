package com.appGate.rbac.util;

import java.io.*;
import java.nio.file.*;
import java.time.Instant;

import org.springframework.web.multipart.MultipartFile;

public class FileUploadUtil {

  public static String saveImage(String folderName, String fileName, MultipartFile multipartFile) throws IOException {

    String fileSavedPath = "";
    Path uploadPath = Paths.get(folderName);
    if (!Files.exists(uploadPath)) {
      Files.createDirectories(uploadPath);
    }

    try (InputStream inputStream = multipartFile.getInputStream()) {
      Path filePath = uploadPath.resolve(fileName);

      Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

      fileSavedPath = folderName + "/" + fileName;

      fileSavedPath = fileSavedPath.replace("\\", "/");
    } catch (IOException ioe) {
      throw new IOException("Could not save image file: " + fileName, ioe);
    }

    return fileSavedPath;
  }

  public static String generateUniqueName(String input) {
    if (input == null || input.isBlank()) {
      throw new IllegalArgumentException("Input string cannot be null or empty");
    }

    // Find the last dot (.) to extract the extension
    int lastDotIndex = input.lastIndexOf(".");
    if (lastDotIndex == -1 || lastDotIndex == 0) {
      throw new IllegalArgumentException("Invalid filename format: missing or invalid extension");
    }

    // Extract filename without extension
    String fileName = input.substring(0, lastDotIndex);
    String extension = input.substring(lastDotIndex); // Includes the dot (e.g., ".jpg")

    // Use regex to split on space, slash, hyphen, underscore, or dot
    String firstWord = fileName.trim().split("[\\s/_.-]+")[0];

    // Get the current timestamp
    long timestamp = Instant.now().toEpochMilli();

    // Concatenate first word with timestamp
    return firstWord + "_" + timestamp + extension;
  }

  public static void deleteImage(String filePath) throws IOException {
    try {
      Path path = Paths.get(filePath);

      // Check if file exists before attempting deletion
      if (!Files.exists(path)) {
        throw new IOException("File not found: " + filePath);
      }

      // Delete the file
      Files.delete(path);
    } catch (IOException e) {
      throw new IOException("Could not delete image file: " + filePath, e);
    }
  }
}
