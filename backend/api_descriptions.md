# API Documentation — KalaSetu Backend

All endpoints are prefixed with `/api/v1`. The backend runs at `http://localhost:8001` by default.

---

## Categories — `/api/v1/categories`

Manages Indian art style categories stored in the Firestore `categories` collection.

**Schema — `CategoryBase`**
```json
{
  "categoryId": "string (auto-generated if omitted)",
  "name": "string",
  "description": "string (optional)",
  "imageUrl": "string (optional)",
  "gradientTheme": "string (optional, defaults to 'from-purple-100 to-indigo-100')",
  "createdAt": "datetime",
  "active": "boolean"
}
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/categories` | Returns all active categories (`active == true`). Used by the marketplace sidebar and home categories grid. |
| `GET` | `/api/v1/categories/{category_id}` | Returns a single category by its ID. Returns `404` if not found. |
| `POST` | `/api/v1/categories` | Creates a new category. Auto-generates `categoryId` if not provided. |
| `PUT` | `/api/v1/categories/{category_id}` | Partially updates a category (pass only the fields to change). Returns `404` if not found. |
| `DELETE` | `/api/v1/categories/{category_id}` | Soft-deletes a category by setting `active: false`. Returns `404` if not found. |

---

## Catalog (Products) — `/api/v1/catalog`

Fetches painting products stored in the Firestore `products` collection. Each product belongs to a category via its `craftType` field.

**Schema — `ProductBase`**
```json
{
  "productId": "string",
  "artisanId": "string",
  "title": "string",
  "description": "string (optional)",
  "price": "float (INR)",
  "currency": "string (default: 'INR')",
  "images": ["string (Firebase Storage URL)"],
  "craftType": "string (matches a category name, e.g. 'Madhubani Painting')",
  "region": "string",
  "stock": "integer (1–15)",
  "rating": "float (0.0–5.0)",
  "reviewCount": "integer",
  "createdAt": "datetime",
  "active": "boolean"
}
```

| Method | Path | Query Params | Description |
|--------|------|--------------|-------------|
| `GET` | `/api/v1/catalog` | `craft_type` (optional), `active_only` (default: `true`) | Returns all active paintings. Filter by category using `?craft_type=Madhubani Painting`. Missing fields (price, stock) are filled with sensible defaults. |
| `GET` | `/api/v1/catalog/{product_id}` | — | Returns a single painting by its Firestore document ID. Returns `404` if not found. |

**Notes:**
- `stock` drives the availability badge on cards: `> 5` → In Stock, `1–5` → Low Stock, `0` → Out of Stock.
- `rating` is recomputed automatically each time a review is posted.

---

## Reviews — `/api/v1/reviews`

Manages customer reviews for paintings. Reviews are stored in the Firestore `reviews` collection. Posting a review automatically recomputes and persists the product's average `rating` and `reviewCount` back to its product document.

**Schema — Review document**
```json
{
  "reviewId": "string (auto-generated UUID)",
  "productId": "string",
  "name": "string",
  "rating": "integer (1–5)",
  "comment": "string",
  "createdAt": "datetime (ISO string)"
}
```

**Request body for POST:**
```json
{
  "name": "string (required)",
  "rating": "integer 1–5 (required)",
  "comment": "string (required)"
}
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/reviews/{product_id}` | Returns all reviews for the given product, sorted newest first. |
| `POST` | `/api/v1/reviews/{product_id}` | Adds a new review for the product, then recalculates and saves the product's average rating. Returns `404` if the product does not exist. |

---

## Auth — `/api/v1/auth`

Handles Firebase-based user authentication (login, registration, token verification).

---

## Users — `/api/v1/users`

Manages user profiles and artisan profiles stored in Firestore.

---

## Ingest — `/api/v1/ingest`

Handles media uploads (images and audio) for artisan products. Processes images (thumbnails via Pillow) and audio (via pydub/FFmpeg), uploads to Firebase Storage, and writes metadata to the Firestore `media_assets` collection.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/ingest/upload` | Upload one or more image/audio files. Requires `artisan_id` and optional `product_id`. Returns storage URLs and metadata for each file. |
| `GET` | `/api/v1/ingest/{asset_id}` | Retrieves metadata for a previously uploaded media asset by its ID. |

---

## Storytelling — `/api/v1/storytelling`

Manages craft stories (text + audio narrations) linked to paintings and artisans.

---

## Discovery — `/api/v1/discovery`

Product discovery and search (placeholder — under development).

---

## Recommendation — `/api/v1/recommendation`

AI-powered product recommendations (under development).

---

## Analytics — `/api/v1/analytics`

Tracks user interactions (views, likes, saves) for analytics and recommendation training.

---

## Live — `/api/v1/live`

Live artisan streaming features (under development).

---

## Utility Scripts

These Python scripts are run once from the `backend/` directory to populate or patch Firestore data.

| Script | Command | Description |
|--------|---------|-------------|
| `seed_categories.py` | `python seed_categories.py` | Seeds 8 Indian art style categories (Madhubani, Warli, Gond, etc.) into Firestore if they don't already exist. |
| `seed_products.py` | `python seed_products.py` | Reads all images from Firebase Storage `dataset/` folders and creates one product document per painting, with a random price (₹500–₹2000), stock (1–15), and rating (3.5–5.0). Idempotent — skips already-seeded products. |
| `backfill_stock.py` | `python backfill_stock.py` | Adds `stock` and `rating` fields to any existing products that are missing them. Safe to run multiple times. |
| `scripts/update_category_images.py` | `python scripts/update_category_images.py` | Picks the first image from each Storage dataset folder and sets it as the `imageUrl` on the corresponding Firestore category document. |
