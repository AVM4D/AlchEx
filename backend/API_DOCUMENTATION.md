# AlchEx — API Documentation

> **Base URL:** `http://localhost:4000/api`
>
> **Authentication:** JWT Bearer Token sent in `Authorization: Bearer <token>` header.
> Login/Register endpoints return the access token. Refresh token is stored as an httpOnly cookie.
>
> **Response Format:** All responses follow this structure:
> ```json
> { "success": true, "message": "...", "data": { ... } }
> ```
> Error responses:
> ```json
> { "success": false, "message": "Error description" }
> ```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Posts (CRUD)](#2-posts-crud)
3. [Offers (CRUD)](#3-offers-crud)
4. [Transactions (CRUD)](#4-transactions-crud)
5. [Chat / Messages (CRUD)](#5-chat--messages-crud)
6. [Users & Ratings (CRUD)](#6-users--ratings-crud)
7. [Reports & Notifications (CRUD)](#7-reports--notifications-crud)
8. [Admin](#8-admin)
9. [Views & Analytics](#9-views--analytics-sql-views)

---

## 1. Authentication

### POST `/api/auth/register`

Create a new user account.

**Auth:** None

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "a1b2c3d4-...",
      "email": "student@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "reputationScore": 0,
      "totalExchanges": 0,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST `/api/auth/login`

Login and receive JWT tokens.

**Auth:** None

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "STUDENT" },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST `/api/auth/refresh`

Refresh an expired access token using the refresh token cookie.

**Auth:** Refresh token cookie (automatic)

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": { "accessToken": "eyJhbGciOi..." }
}
```

---

### POST `/api/auth/logout`

Logout and clear refresh token cookie.

**Auth:** Bearer Token

**Response (200):**
```json
{ "success": true, "message": "Logged out successfully", "data": null }
```

---

### GET `/api/auth/me`

Get current authenticated user's profile.

**Auth:** Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...", "email": "...", "firstName": "John", "lastName": "Doe",
    "profilePicture": null, "bio": "CS Student", "batch": "2024",
    "program": "BSCS", "university": "FAST-NUCES", "role": "STUDENT",
    "reputationScore": 4.2, "totalExchanges": 5
  }
}
```

---

## 2. Posts (CRUD)

### POST `/api/posts` — **CREATE**

Create a new exchange post.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "title": "Need Calculus Help",
  "description": "Looking for someone to tutor me in Calculus II",
  "whatINeed": "Calculus II tutoring (3 sessions/week)",
  "whatIOffer": "Programming help in Python/JavaScript",
  "category": "TUTORING",
  "tags": "[\"math\", \"calculus\"]",
  "expiresAt": "2025-02-15T00:00:00.000Z",
  "notifyOnOffers": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post-uuid-...",
    "userId": "user-uuid-...",
    "title": "Need Calculus Help",
    "description": "...",
    "whatINeed": "...",
    "whatIOffer": "...",
    "category": "TUTORING",
    "status": "ACTIVE",
    "expiresAt": "2025-02-15T00:00:00.000Z",
    "user": { "id": "...", "firstName": "John", "lastName": "Doe" },
    "offers": [],
    "_count": { "offers": 0 }
  }
}
```

---

### GET `/api/posts/:id` — **READ**

Get a single post by ID with user info and offers.

**Auth:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "Need Calculus Help",
    "status": "ACTIVE",
    "user": { "id": "...", "firstName": "John", "lastName": "Doe", "reputationScore": 4.2 },
    "offers": [
      { "id": "...", "proposalDescription": "I can help!", "status": "PENDING", "user": { ... } }
    ],
    "_count": { "offers": 1 }
  }
}
```

---

### GET `/api/posts/marketplace` — **READ (List)**

Browse all active exchange posts with pagination and filters.

**Auth:** Optional

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `category` | string | — | Filter by category (e.g., `TUTORING`) |
| `search` | string | — | Search in title/description |
| `sort` | string | `createdAt` | Sort field |
| `order` | string | `desc` | Sort direction (`asc`/`desc`) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      { "id": "...", "title": "...", "category": "TUTORING", "status": "ACTIVE", "user": { ... }, "_count": { "offers": 3 } }
    ],
    "total": 25
  }
}
```

---

### GET `/api/posts/my` — **READ (My Posts)**

Get posts created by the authenticated user.

**Auth:** Bearer Token

**Query:** `?page=1&limit=20`

---

### GET `/api/posts/categories` — **READ (Static)**

Get all available post categories.

**Auth:** None

**Response (200):**
```json
{
  "success": true,
  "data": ["TUTORING", "NOTES_SHARING", "PROJECT_HELP", "SKILL_SWAP", "STUDY_GROUP", "LAB_HELP", "BOOK_EXCHANGE", "OTHER"]
}
```

---

### PUT `/api/posts/:id` — **UPDATE**

Update a post (only by the post owner).

**Auth:** Bearer Token

**Request Body (partial update):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "whatINeed": "Updated need"
}
```

**Response (200):**
```json
{ "success": true, "message": "Post updated", "data": { ... } }
```

---

### DELETE `/api/posts/:id` — **DELETE** (Soft)

Soft-delete a post (sets `isDeleted = 1`).

**Auth:** Bearer Token (owner or admin)

**Response (200):**
```json
{ "success": true, "message": "Post deleted", "data": null }
```

---

## 3. Offers (CRUD)

### POST `/api/offers` — **CREATE**

Submit an offer on a post.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "postId": "post-uuid-...",
  "proposalDescription": "I can help you with Calculus! I'm a Math major.",
  "counterExchange": "I'd like help with web development in return"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Offer submitted",
  "data": {
    "id": "offer-uuid",
    "postId": "...",
    "userId": "...",
    "proposalDescription": "...",
    "status": "PENDING",
    "user": { "id": "...", "firstName": "...", "lastName": "..." }
  }
}
```

---

### GET `/api/offers/post/:postId` — **READ**

Get all offers for a specific post.

**Auth:** None

---

### GET `/api/offers/my` — **READ (My Offers)**

Get offers made by the authenticated user.

**Auth:** Bearer Token

**Query:** `?page=1&limit=20`

---

### PUT `/api/offers/:id` — **UPDATE**

Update an offer's proposal.

**Auth:** Bearer Token (offer owner only)

**Request Body:**
```json
{ "proposalDescription": "Updated proposal text" }
```

---

### POST `/api/offers/:id/accept` — **Accept Offer**

Post owner accepts an offer → creates a transaction, rejects all other pending offers.

**Auth:** Bearer Token (post owner)

**Response (200):**
```json
{ "success": true, "message": "Offer accepted. Transaction started.", "data": { "id": "transaction-uuid", "status": "IN_PROGRESS", ... } }
```

---

### POST `/api/offers/:id/withdraw` — **Withdraw Offer**

Offerer withdraws their own offer.

**Auth:** Bearer Token (offer owner)

---

### DELETE `/api/offers/:id` — **DELETE** (Soft)

Soft-delete an offer.

**Auth:** Bearer Token (offer owner)

---

## 4. Transactions (CRUD)

### GET `/api/transactions/my` — **READ (List)**

Get authenticated user's transactions.

**Auth:** Bearer Token

**Query:** `?page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...", "status": "IN_PROGRESS",
        "requesterDone": false, "offererDone": false,
        "post": { "id": "...", "title": "..." },
        "requester": { "id": "...", "firstName": "...", "lastName": "..." },
        "offerer": { "id": "...", "firstName": "...", "lastName": "..." }
      }
    ],
    "total": 3
  }
}
```

---

### GET `/api/transactions/:id` — **READ (Single)**

Get full transaction details including post, offer, both participants, and ratings.

**Auth:** Bearer Token (participant only)

---

### POST `/api/transactions/:id/complete` — **UPDATE (Mark Complete)**

Mark your side of the exchange as done. When both sides are done, transaction status becomes `SUCCESSFUL`.

**Auth:** Bearer Token (participant)

**Response (200):**
```json
{ "success": true, "message": "Marked as complete", "data": { "id": "...", "requesterDone": true, "offererDone": false, "status": "IN_PROGRESS" } }
```

---

### POST `/api/transactions/:id/cancel` — **UPDATE (Cancel)**

Cancel the transaction.

**Auth:** Bearer Token (participant)

---

## 5. Chat / Messages (CRUD)

### POST `/api/chat` — **CREATE**

Send a message within a transaction.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "transactionId": "transaction-uuid-...",
  "content": "Hello! Ready to start the exchange?"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid", "transactionId": "...", "content": "Hello! Ready to start the exchange?",
    "messageType": "TEXT", "isRead": false, "createdAt": "...",
    "sender": { "id": "...", "firstName": "John", "lastName": "Doe" }
  }
}
```

---

### GET `/api/chat/:transactionId` — **READ**

Get chat messages for a transaction (paginated, oldest first).

**Auth:** Bearer Token (participant only)

**Query:** `?page=1&limit=50`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      { "id": "...", "content": "Hello!", "messageType": "TEXT", "isRead": true, "sender": { ... } }
    ],
    "total": 15
  }
}
```

---

### GET `/api/chat/unread` — **READ (Count)**

Get total unread message count across all active transactions.

**Auth:** Bearer Token

**Response (200):**
```json
{ "success": true, "data": 5 }
```

---

## 6. Users & Ratings (CRUD)

### GET `/api/users/profile` — **READ**

Get authenticated user's full profile.

**Auth:** Bearer Token

---

### PUT `/api/users/profile` — **UPDATE**

Update the authenticated user's profile.

**Auth:** Bearer Token

**Request Body (all optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Computer Science student passionate about algorithms",
  "batch": "2024",
  "program": "BSCS",
  "section": "A",
  "university": "FAST-NUCES",
  "campus": "Islamabad",
  "socialLinks": "{\"github\": \"johndoe\", \"linkedin\": \"johndoe\"}"
}
```

---

### GET `/api/users/leaderboard` — **READ**

Get top users by reputation score.

**Auth:** None

**Query:** `?limit=10`

---

### GET `/api/users/:id` — **READ (Public Profile)**

Get any user's public profile by ID.

**Auth:** None

---

### POST `/api/users/ratings` — **CREATE Rating**

Rate your exchange partner after a completed transaction.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "transactionId": "transaction-uuid-...",
  "score": 5,
  "review": "Great exchange partner! Very helpful and responsive."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rating-uuid", "score": 5, "review": "Great exchange partner!",
    "giver": { "id": "...", "firstName": "John" },
    "receiver": { "id": "...", "firstName": "Jane" }
  }
}
```

---

### GET `/api/users/:id/ratings` — **READ Ratings**

Get all ratings received by a user.

**Auth:** None

**Query:** `?page=1&limit=20`

---

### GET `/api/users/:id/rating-stats` — **READ Rating Stats**

Get a user's rating distribution (5★, 4★, 3★, etc.).

**Auth:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalRatings": 12,
    "distribution": [
      { "score": 5, "count": 8 },
      { "score": 4, "count": 3 },
      { "score": 3, "count": 1 }
    ]
  }
}
```

---

### GET `/api/users/ratings/:id` — **READ Single Rating**

**Auth:** None

### PUT `/api/users/ratings/:id` — **UPDATE Rating**

**Auth:** Bearer Token (rating giver only)

**Request Body:**
```json
{ "score": 4, "review": "Updated review" }
```

### DELETE `/api/users/ratings/:id` — **DELETE Rating** (Soft)

**Auth:** Bearer Token (rating giver only)

---

## 7. Reports & Notifications (CRUD)

### POST `/api/reports` — **CREATE Report**

Report a user within a transaction context.

**Auth:** Bearer Token

**Request Body:**
```json
{
  "transactionId": "transaction-uuid-...",
  "targetUserId": "user-uuid-...",
  "reason": "INAPPROPRIATE_BEHAVIOR",
  "description": "User was unresponsive and did not fulfill their side of the exchange"
}
```

---

### GET `/api/notifications` — **READ**

Get authenticated user's notifications (paginated).

**Auth:** Bearer Token

**Query:** `?page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      { "id": "...", "type": "OFFER_RECEIVED", "title": "New Offer!", "message": "You received a new offer on your post", "isRead": false, "createdAt": "..." }
    ],
    "total": 8,
    "unreadCount": 3
  }
}
```

---

### PATCH `/api/notifications/:id/read` — **UPDATE (Mark Read)**

**Auth:** Bearer Token

### PATCH `/api/notifications/read-all` — **UPDATE (Mark All Read)**

**Auth:** Bearer Token

### DELETE `/api/notifications/:id` — **DELETE**

Hard-delete a notification.

**Auth:** Bearer Token

---

## 8. Admin

> All admin endpoints require `role: "ADMIN"`.

### GET `/api/admin/dashboard` — **READ Stats**

**Auth:** Bearer Token (Admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150, "bannedUsers": 3,
    "totalPosts": 89, "activePosts": 42,
    "totalTransactions": 35, "activeTransactions": 12,
    "pendingReports": 5, "totalReports": 8
  }
}
```

---

### GET `/api/admin/users` — **READ Users**

**Auth:** Bearer Token (Admin)

**Query:** `?page=1&limit=20&search=john`

---

### POST `/api/admin/users/ban` — **Ban User**

**Auth:** Bearer Token (Admin)

**Request Body:**
```json
{ "userId": "user-uuid-...", "reason": "Repeated policy violations" }
```

---

### POST `/api/admin/users/:id/unban` — **Unban User**

**Auth:** Bearer Token (Admin)

---

### GET `/api/admin/reports` — **READ Reports**

**Auth:** Bearer Token (Admin)

**Query:** `?page=1&limit=20&status=PENDING`

---

### POST `/api/admin/reports/resolve` — **Resolve Report**

**Auth:** Bearer Token (Admin)

**Request Body:**
```json
{ "reportId": "report-uuid-...", "status": "RESOLVED", "adminNotes": "Investigated and resolved" }
```

---

### DELETE `/api/admin/reports/:id` — **DELETE Report**

**Auth:** Bearer Token (Admin)

---

### GET `/api/admin/transactions` — **READ All Transactions**

**Auth:** Bearer Token (Admin)

**Query:** `?page=1&limit=20&status=IN_PROGRESS`

---

### POST `/api/admin/transactions/:id/force-cancel` — **Force Cancel**

**Auth:** Bearer Token (Admin)

---

## 9. Views & Analytics (SQL Views)

> These endpoints query SQL Server Views for analytics and aggregated data.

### Public Endpoints (No Auth)

| Method | Endpoint | Description | SQL View Used |
|--------|----------|-------------|---------------|
| GET | `/api/views/leaderboard?limit=10` | Top users by reputation | `vw_Leaderboard` |
| GET | `/api/views/marketplace?category=TUTORING&page=1` | Active posts by category | `vw_ActivePostsByCategory` |
| GET | `/api/views/search?q=programming` | Search posts by keyword | `vw_ActivePostsByCategory` + LIKE |
| GET | `/api/views/top-rated?limit=10` | Highest rated users | `vw_UserRatingStats` |
| GET | `/api/views/categories` | Most popular categories | `vw_PopularCategories` |
| GET | `/api/views/recent-exchanges?limit=10` | Recently completed exchanges | `vw_TransactionSummary` |
| GET | `/api/views/expiring-posts` | Posts expiring in next 24h | Direct query |

### Authenticated User Endpoints

| Method | Endpoint | Description | SQL View Used |
|--------|----------|-------------|---------------|
| GET | `/api/views/user/:id/rating-stats` | User's rating breakdown | `vw_UserRatingStats` |
| GET | `/api/views/user/:id/profile-stats` | User profile with exchange stats | Multi-table aggregation |
| GET | `/api/views/user/:id/exchange-history` | User's exchange history | `vw_UserExchangeHistory` |
| GET | `/api/views/user/:id/conversations` | User's active conversations | Multi-table JOIN |
| GET | `/api/views/user/:id/pending-offers` | Pending offers grouped by post | Direct query |
| GET | `/api/views/transaction/:id/summary` | Full transaction summary | `vw_TransactionSummary` |

### Admin Endpoints

| Method | Endpoint | Description | SQL View Used |
|--------|----------|-------------|---------------|
| GET | `/api/views/admin/dashboard` | Platform-wide statistics | `vw_AdminDashboard` |
| GET | `/api/views/admin/pending-reports` | Unresolved reports | `vw_PendingReports` |
| GET | `/api/views/admin/post-distribution` | Posts by status | `vw_PostStatusDistribution` |
| GET | `/api/views/admin/completion-rate` | Transaction completion % | Aggregation query |
| GET | `/api/views/admin/monthly-activity` | Monthly trends | Aggregation query |

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js v4 |
| Language | TypeScript |
| Database | Microsoft SQL Server |
| DB Driver | mssql (native driver) |
| Authentication | JWT (access + refresh tokens) |
| Validation | Zod schemas |
| Real-time | Socket.IO (chat) |
| Security | Helmet, CORS, rate limiting, XSS sanitization |
| Scheduling | node-cron (auto-expire posts/offers/transactions) |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

*AlchEx — Non-Monetary Student Exchange Platform*
*Database Systems Course Deliverable*
