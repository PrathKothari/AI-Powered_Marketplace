# API Documentation — KalaSetu Backend

All endpoints are prefixed with `/api/v1`. The backend runs at `http://localhost:8001` by default.  
Interactive docs: `http://localhost:8001/docs` (Swagger UI) · `http://localhost:8001/redoc`

Authentication: protected endpoints require `Authorization: Bearer <token>` in the request header.

---

## Auth — `/api/v1/auth`

Handles user registration, login, Google OAuth, and profile management.  
Tokens are 30-day JWT signed with `SECRET_KEY`. Payload: `{ sub, email, name, role }`.

**Auth response schema (returned by signup / login / google)**
```json
{
  "access_token": "string (JWT)",
  "token_type": "bearer",
  "user": {
    "uid": "string",
    "email": "string",
    "name": "string",
    "role": "user"
  }
}
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/signup` | No | Create a new account with name, email, password. Password rules: min 8 chars, 1 uppercase, 1 number, 1 special character. Creates user in Firebase Auth + Firestore `users` collection. Sends a Firebase email verification link and a KalaSetu welcome email (Gmail SMTP). Returns JWT + user object. |
| `POST` | `/api/v1/auth/login` | No | Sign in with email + password via Firebase Identity Toolkit. Returns JWT + user object. |
| `POST` | `/api/v1/auth/google` | No | Authenticate with a Google ID token from Google Identity Services (frontend). Verifies token audience against `GOOGLE_CLIENT_ID`. Creates user in Firebase Auth + Firestore if first login. Sends welcome email to new Google users. Returns JWT + user object. |
| `POST` | `/api/v1/auth/forgot-password` | No | Sends a password reset email via Firebase. Always returns success to prevent user enumeration. Body: `{ "email": "string" }`. |
| `GET` | `/api/v1/auth/me` | **Yes** | Returns the authenticated user's profile decoded from the JWT. |
| `POST` | `/api/v1/auth/logout` | No | Stateless logout — client removes the token. Always returns success. |
| `PATCH` | `/api/v1/auth/profile` | **Yes** | Update the authenticated user's display name. Updates Firestore `users` doc + Firebase Auth display name. Returns a fresh JWT with the updated name. Body: `{ "name": "string" }`. |

**Request bodies:**
```json
// POST /signup
{ "name": "string", "email": "string", "password": "string" }

// POST /login
{ "email": "string", "password": "string" }

// POST /google
{ "credential": "string (Google ID token)" }

// POST /forgot-password
{ "email": "string" }

// PATCH /profile
{ "name": "string" }
```

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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/categories` | No | Returns all active categories (`active == true`). Used by the marketplace sidebar and sell page craft type dropdown. |
| `GET` | `/api/v1/categories/{category_id}` | No | Returns a single category by its ID. Returns `404` if not found. |
| `POST` | `/api/v1/categories` | No | Creates a new category. Auto-generates `categoryId` if not provided. |
| `PUT` | `/api/v1/categories/{category_id}` | No | Partially updates a category. Returns `404` if not found. |
| `DELETE` | `/api/v1/categories/{category_id}` | No | Soft-deletes a category by setting `active: false`. Returns `404` if not found. |

---

## Catalog (Products) — `/api/v1/catalog`

Full CRUD for paintings stored in the Firestore `products` collection. Any authenticated user can list and manage their own paintings (combined buyer+seller model — no role separation).

**Product schema**
```json
{
  "productId": "string (UUID)",
  "artisanId": "string (Firebase UID of the seller)",
  "artisanName": "string",
  "title": "string",
  "description": "string",
  "price": "float (INR)",
  "currency": "INR",
  "craftType": "string (matches a category name, e.g. 'Warli Painting')",
  "region": "string (Indian state)",
  "materials": "string",
  "images": ["string (Firebase Storage URL)"],
  "storyVideo": "string (URL, optional)",
  "stock": "integer",
  "rating": "float (0.0–5.0)",
  "reviewCount": "integer",
  "active": "boolean",
  "createdAt": "datetime (ISO)"
}
```

| Method | Path | Auth | Query Params | Description |
|--------|------|------|--------------|-------------|
| `GET` | `/api/v1/catalog` | No | `craft_type` (optional), `active_only` (default: `true`), `seller_id` (optional) | Returns paintings. Filter by category with `?craft_type=Warli Painting`. Filter by seller UID with `?seller_id=<uid>&active_only=false` (used by the seller's inventory/dashboard). Missing fields are filled with sensible defaults. |
| `GET` | `/api/v1/catalog/{product_id}` | No | — | Returns a single painting by Firestore document ID. Returns `404` if not found. |
| `POST` | `/api/v1/catalog` | **Yes** | — | Create a new listing. Sets `artisanId` from the JWT. Returns the created product document. Status `201`. |
| `PUT` | `/api/v1/catalog/{product_id}` | **Yes** | — | Update a listing. Only the owner (`artisanId == current user`) can update. Returns `403` for non-owners. Pass only fields to change. |
| `DELETE` | `/api/v1/catalog/{product_id}` | **Yes** | — | Permanently delete a listing. Only the owner can delete. Returns `403` for non-owners. Status `204`. |

**POST / PUT request body:**
```json
{
  "title": "string",
  "price": 1200,
  "description": "string",
  "craftType": "Warli Painting",
  "region": "Maharashtra",
  "materials": "Natural dyes, handmade paper",
  "images": ["https://firebasestorage.googleapis.com/..."],
  "storyVideo": "string (optional)"
}
```

**Notes:**
- Images must be uploaded to Firebase Storage first (`products/` path). The sell page handles this automatically.
- `stock` drives the availability badge: `> 3` → In Stock, `≤ 3` → Low Stock, `0` → Out of Stock.
- `rating` is recomputed automatically each time a review is posted.

---

## Reviews — `/api/v1/reviews`

Manages customer reviews stored in the Firestore `reviews` collection. Posting a review automatically recomputes the product's average `rating` and `reviewCount`.

**Review schema**
```json
{
  "reviewId": "string (UUID)",
  "productId": "string",
  "name": "string",
  "rating": "integer (1–5)",
  "comment": "string",
  "createdAt": "datetime (ISO)"
}
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/reviews/{product_id}` | No | Returns all reviews for the product, sorted newest first (Python-side sort to avoid Firestore composite index). |
| `POST` | `/api/v1/reviews/{product_id}` | No | Add a review. Recalculates and persists product's average rating. Returns `404` if product does not exist. |

**POST request body:**
```json
{ "name": "string", "rating": 4, "comment": "string" }
```

---

## Orders — `/api/v1/orders`

Manages purchase orders stored in the Firestore `orders` collection. Orders are created either via direct checkout or after Razorpay payment verification.

**Order schema**
```json
{
  "orderId": "string (e.g. 'ORD-A1B2C3D4')",
  "userId": "string (Firebase UID of the buyer)",
  "sellerIds": ["string (Firebase UID of each artisan whose product is in this order)"],
  "items": [
    {
      "id": "string (productId)",
      "name": "string",
      "price": "float",
      "quantity": "integer",
      "image": "string (URL)"
    }
  ],
  "total": "float (INR)",
  "status": "Processing | Shipped | Delivered",
  "paymentId": "string (Razorpay payment ID, present for Razorpay orders)",
  "razorpayOrderId": "string (present for Razorpay orders)",
  "createdAt": "datetime (ISO)"
}
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/orders/` | **Yes** | Create an order directly from cart items (non-Razorpay flow). Looks up each item's `artisanId` from Firestore and stores them in `sellerIds`. Sets `status: "Processing"`. Status `201`. |
| `GET` | `/api/v1/orders/seller` | **Yes** | Returns all orders that contain the authenticated user's paintings (seller view). Queries by `sellerIds array_contains uid`. Sorted newest first. |
| `GET` | `/api/v1/orders/` | **Yes** | Returns all orders placed by the authenticated user (buyer view), sorted newest first. |
| `GET` | `/api/v1/orders/{order_id}` | **Yes** | Returns a specific order. Accessible by the buyer (`userId`) or any seller whose product is in the order (`sellerIds`). Returns `403` otherwise. |
| `PATCH` | `/api/v1/orders/{order_id}/status` | **Yes** | Update order status. Valid values: `Processing`, `Shipped`, `Delivered`. Accessible by the buyer or any seller of the order. |

**POST /orders/ request body:**
```json
{
  "items": [{ "id": "string", "name": "string", "price": 1200, "quantity": 1, "image": "string" }],
  "total": 1200
}
```

**PATCH /orders/{id}/status request body:**
```json
{ "status": "Shipped" }
```

---

## Payments (Razorpay) — `/api/v1/payments`

Two-step Razorpay payment flow: create a server-side order → open the Razorpay checkout modal on the frontend → verify the payment signature on the backend → create the Firestore order.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/payments/create-order` | **Yes** | Creates a Razorpay order. Returns the data needed to initialise the Razorpay checkout modal (`razorpay_order_id`, `amount` in paise, `currency`, `key_id`). |
| `POST` | `/api/v1/payments/verify` | **Yes** | Verifies the Razorpay HMAC-SHA256 payment signature. If valid, creates the order in Firestore with `paymentId` and `razorpayOrderId` fields. Returns `{ success: true, orderId: "ORD-..." }`. Returns `400` if signature is invalid. |

**POST /payments/create-order request body:**
```json
{
  "amount": 1200.0,
  "currency": "INR",
  "items": [{ "id": "string", "name": "string", "price": 1200, "quantity": 1, "image": "string" }]
}
```

**POST /payments/create-order response:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "amount": 120000,
  "currency": "INR",
  "key_id": "rzp_test_..."
}
```

**POST /payments/verify request body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "string (HMAC-SHA256 hex)",
  "items": [{ "id": "string", "name": "string", "price": 1200, "quantity": 1, "image": "string" }],
  "total": 1200.0
}
```

**Notes:**
- Amount is in **paise** in Razorpay calls (1 INR = 100 paise). The backend converts INR → paise automatically.
- Signature verification: `HMAC-SHA256(key=RAZORPAY_KEY_SECRET, msg="{order_id}|{payment_id}")`.

---

## Users — `/api/v1/users`

Manages user profiles stored in Firestore `users` collection.

---

## Ingest — `/api/v1/ingest`

Handles direct media uploads (images and audio) for artisan products.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/ingest/upload` | Upload image/audio files. Requires `artisan_id` and optional `product_id`. Returns Firebase Storage URLs and metadata. |
| `GET` | `/api/v1/ingest/{asset_id}` | Retrieves metadata for a previously uploaded media asset. |

---

## Storytelling — `/api/v1/storytelling`

Manages craft stories (text + audio narrations) linked to paintings and artisans.

---

## Discovery — `/api/v1/discovery`

AI-powered craft origin detection and visual product search. Combines CLIP image embeddings, Pinecone vector similarity search, and Gemini 2.5 Flash vision analysis.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/discovery/analyze-craft` | No | Upload a craft image (multipart form). Returns a Gemini-generated craft analysis and a list of matching products from the catalog. |

**Request:** `multipart/form-data` with field `image` (JPG/PNG/WEBP, max 10 MB).

**Response:**
```json
{
  "analysis": "string (Gemini markdown — craft name, region, history, technique, features)",
  "matchedProducts": [
    {
      "productId": "string",
      "title": "string",
      "price": 1200,
      "craftType": "Warli Painting",
      "region": "Maharashtra",
      "images": ["https://..."],
      "description": "string",
      "similarity": 0.87
    }
  ],
  "hasMatch": true
}
```

**How it works:**
1. Image is converted to a 512-dim CLIP embedding (`openai/clip-vit-base-patch32`)
2. Embedding is queried against Pinecone `product-images` index (cosine similarity, top-5, threshold >= 60%)
3. Matching product details are fetched from Firestore
4. Image + match context is sent to **Gemini 2.5 Flash** for a rich craft origin analysis
5. First call is slower (~5-10s) due to CLIP model download; subsequent calls are fast

---

## Recommendation — `/api/v1/recommendation`

AI-powered product recommendations (under development).

---

## Analytics — `/api/v1/analytics`

Tracks user interactions (views, likes, saves) for recommendations.

---

## Live — `/api/v1/live`

Live artisan streaming features (under development).

---

## Email — Internal (not an HTTP endpoint)

Outbound emails are sent via Gmail SMTP (`EMAIL_SENDER` / `EMAIL_PASSWORD` in `.env`).

| Trigger | Email sent |
|---------|-----------|
| New signup (email/password) | Firebase email verification link + KalaSetu HTML welcome email |
| New signup (Google OAuth, first login only) | KalaSetu HTML welcome email |

SMTP config: `smtplib.SMTP_SSL("smtp.gmail.com", 465)`. Requires a Gmail App Password (not the regular Gmail password). Silently skipped if env vars are not set.

---

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `SECRET_KEY` | Auth | JWT signing secret |
| `FIREBASE_PROJECT_ID` | All | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | All | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | All | Firebase Admin SDK client email |
| `FIREBASE_STORAGE_BUCKET` | Storage | Firebase Storage bucket name |
| `FIREBASE_API_KEY` | Auth | Firebase web API key (for Identity Toolkit REST calls) |
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth client ID (for verifying Google ID tokens) |
| `RAZORPAY_KEY_ID` | Payments | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay secret key (for HMAC signature verification) |
| `EMAIL_SENDER` | Email | Gmail address to send from |
| `EMAIL_PASSWORD` | Email | Gmail App Password |
| `GEMINI_API_KEY` | AI features | Google Gemini API key |
| `PINECONE_API_KEY` | Discovery | Pinecone vector DB API key |
| `PINECONE_IMAGE_INDEX` | Discovery | Pinecone index name for image embeddings (default: `product-images`) |
| `HF_TOKEN` | Discovery | HuggingFace token for authenticated CLIP model downloads (optional but recommended) |

---

## Utility Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `seed_categories.py` | `python seed_categories.py` | Seeds 8 Indian art style categories into Firestore if they don't already exist. |
| `seed_products.py` | `python seed_products.py` | Reads images from Firebase Storage `dataset/` folders and creates product documents with random price, stock, and rating. Idempotent. |
| `backfill_stock.py` | `python backfill_stock.py` | Adds `stock` and `rating` fields to existing products missing them. Safe to run multiple times. |
| `scripts/update_category_images.py` | `python scripts/update_category_images.py` | Sets `imageUrl` on each Firestore category from the first image in the corresponding Storage dataset folder. |
| `seed_embeddings.py` | `python seed_embeddings.py` | Generates CLIP embeddings for all Firestore products with valid image URLs and upserts them into the Pinecone `product-images` index. Creates the index (512-dim, cosine) if it doesn't exist. Safe to re-run. |
