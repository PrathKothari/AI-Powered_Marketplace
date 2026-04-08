# Categories API Documentation

This document describes the CRUD (Create, Read, Update, Delete) APIs created for managing Indian Art categories in the backend.

## Base URL
All category endpoints are nested under: `/api/v1/categories`

## Schema Overview

**`CategoryBase`**
```json
{
  "categoryId": "string (optional during creation)",
  "name": "string",
  "description": "string (optional)",
  "imageUrl": "string (optional)",
  "gradientTheme": "string (optional, defaults to purple/indigo)",
  "createdAt": "datetime",
  "active": "boolean"
}
```

---

## Endpoints

### 1. Get All Categories
Retrieves a list of all active categories (e.g., painting styles) from Firestore.

- **Method:** `GET`
- **Path:** `/api/v1/categories/`
- **Response:**
  - `200 OK`: Returns an array of `CategoryBase` objects. Only categories where `active == true` are returned.

### 2. Get a Specific Category
Retrieves details for a single category using its unique ID.

- **Method:** `GET`
- **Path:** `/api/v1/categories/{category_id}`
- **Path Parameters:**
  - `category_id` (string): The unique identifier of the category.
- **Response:**
  - `200 OK`: Returns the `CategoryBase` object.
  - `404 Not Found`: Returned if the category does not exist.

### 3. Create a New Category
Creates a new category in the database.

- **Method:** `POST`
- **Path:** `/api/v1/categories/`
- **Request Body:** Requires a `CategoryBase` JSON payload. If `categoryId` is not provided, a UUID will be automatically generated.
- **Response:**
  - `200 OK`: Returns the created `CategoryBase` object.

### 4. Update a Category
Updates specific fields of an existing category.

- **Method:** `PUT`
- **Path:** `/api/v1/categories/{category_id}`
- **Path Parameters:**
  - `category_id` (string): The unique identifier of the category.
- **Request Body:** JSON payload containing the fields to update (e.g., `{"name": "Updated Name"}`).
- **Response:**
  - `200 OK`: Returns the fully updated `CategoryBase` object.
  - `404 Not Found`: Returned if the category does not exist.

### 5. Delete a Category
Soft-deletes a category so it no longer appears in the active marketplace.

- **Method:** `DELETE`
- **Path:** `/api/v1/categories/{category_id}`
- **Path Parameters:**
  - `category_id` (string): The unique identifier of the category.
- **Response:**
  - `200 OK`: Returns a success message `{"message": "Category deleted successfully"}`.
  - `404 Not Found`: Returned if the category does not exist.
  - *Note: This performs a "soft delete" by setting `active: False` in Firestore.*
