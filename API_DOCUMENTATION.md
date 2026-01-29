# Production-Ready REST API Documentation

## 📚 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth Endpoints](#1-authentication-endpoints)
  - [Dorm Group Endpoints](#2-dorm-group-endpoints)
  - [Debt Endpoints](#3-debt-endpoints)
  - [Debt Resolution Endpoints](#4-debt-resolution-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## 🌟 Overview

Base URL: `http://localhost:3000/api`

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## 🔐 Authentication

Most endpoints require authentication via JWT tokens. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

---

## 📋 Endpoints

### 1. Authentication Endpoints

#### Register New User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "ahmed_123",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "fullName": "Ahmed Hassan"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ahmed_123",
    "email": "ahmed@example.com",
    "password": "SecurePass123!",
    "fullName": "Ahmed Hassan"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65f...",
      "username": "ahmed_123",
      "email": "ahmed@example.com",
      "fullName": "Ahmed Hassan"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

#### Login

**POST** `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "SecurePass123!"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f...",
      "username": "ahmed_123",
      "email": "ahmed@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

#### Refresh Access Token

**POST** `/api/auth/refresh-token`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

---

#### Get Current User

**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "_id": "65f...",
    "username": "ahmed_123",
    "email": "ahmed@example.com",
    "fullName": "Ahmed Hassan",
    "phoneNumber": "+201234567890",
    "profilePicture": "https://...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### Update Profile

**PATCH** `/api/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullName": "Ahmed Hassan Mohamed",
  "phoneNumber": "+201234567890",
  "profilePicture": "https://example.com/avatar.jpg"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ahmed Hassan Mohamed",
    "phoneNumber": "+201234567890"
  }'
```

---

#### Change Password

**PATCH** `/api/auth/password`

Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/auth/password \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

---

#### Logout

**POST** `/api/auth/logout`

Invalidate refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### 2. Dorm Group Endpoints

#### Create Dorm Group

**POST** `/api/dorms`

Create a new dorm group.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Dorm 3A - Floor 2",
  "description": "Engineering dorm students",
  "settings": {
    "requireApprovalForDebts": true,
    "allowNegativeBalances": false,
    "autoResolveDebts": true
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/dorms \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dorm 3A - Floor 2",
    "description": "Engineering dorm students"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Dorm group created successfully",
  "data": {
    "_id": "65f...",
    "name": "Dorm 3A - Floor 2",
    "inviteCode": "ABC123XYZ",
    "members": [
      {
        "user": "65f...",
        "role": "admin"
      }
    ]
  }
}
```

---

#### Join Dorm Group

**POST** `/api/dorms/join`

Join an existing dorm group using invite code.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "inviteCode": "ABC123XYZ"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/dorms/join \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "inviteCode": "ABC123XYZ"
  }'
```

---

#### Get User's Groups

**GET** `/api/dorms/my-groups`

Get all groups the user is a member of.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/dorms/my-groups \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Groups retrieved successfully",
  "data": [
    {
      "_id": "65f...",
      "name": "Dorm 3A - Floor 2",
      "memberCount": 5,
      "role": "admin",
      "totalDebts": 1250.50
    }
  ]
}
```

---

#### Get Group Details

**GET** `/api/dorms/:id`

Get detailed information about a specific group.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/dorms/65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group details retrieved",
  "data": {
    "_id": "65f...",
    "name": "Dorm 3A - Floor 2",
    "description": "Engineering dorm students",
    "inviteCode": "ABC123XYZ",
    "members": [
      {
        "user": {
          "_id": "65f...",
          "fullName": "Ahmed Hassan",
          "username": "ahmed_123"
        },
        "role": "admin",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "stats": {
      "totalDebts": 1250.50,
      "settledDebts": 300.00,
      "pendingDebts": 950.50
    }
  }
}
```

---

#### Update Group

**PATCH** `/api/dorms/:id`

Update group information (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Dorm 3A - Floor 2 (Updated)",
  "description": "Updated description",
  "settings": {
    "requireApprovalForDebts": false
  }
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/dorms/65f... \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dorm 3A - Floor 2 (Updated)"
  }'
```

---

#### Remove Member

**DELETE** `/api/dorms/:id/members/:userId`

Remove a member from the group (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/dorms/65f.../members/65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Leave Group

**POST** `/api/dorms/:id/leave`

Leave a dorm group.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/dorms/65f.../leave \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Delete Group

**DELETE** `/api/dorms/:id`

Delete a dorm group (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/dorms/65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Regenerate Invite Code

**POST** `/api/dorms/:id/regenerate-code`

Generate a new invite code (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/dorms/65f.../regenerate-code \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Update Member Role

**PATCH** `/api/dorms/:id/members/:userId/role`

Change a member's role (admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/dorms/65f.../members/65f.../role \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

---

### 3. Debt Endpoints

#### Create Debt

**POST** `/api/debts`

Create a new debt between two users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "debtor": "65f...",
  "dormGroup": "65f...",
  "amount": 150.50,
  "category": "food",
  "description": "Pizza delivery split",
  "dueDate": "2024-02-01T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/debts \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "debtor": "65f...",
    "dormGroup": "65f...",
    "amount": 150.50,
    "category": "food",
    "description": "Pizza delivery split"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Debt created successfully",
  "data": {
    "_id": "65f...",
    "creditor": "65f...",
    "debtor": "65f...",
    "amount": 150.50,
    "status": "pending",
    "category": "food",
    "description": "Pizza delivery split"
  }
}
```

---

#### Get All Debts

**GET** `/api/debts`

Get all debts with pagination and filters.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status (pending, confirmed, disputed, settled)
- `category` - Filter by category
- `dormGroup` - Filter by dorm group ID
- `creditor` - Filter by creditor ID
- `debtor` - Filter by debtor ID
- `minAmount` - Minimum amount filter
- `maxAmount` - Maximum amount filter

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/debts?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Debts retrieved successfully",
  "data": {
    "debts": [
      {
        "_id": "65f...",
        "creditor": {
          "_id": "65f...",
          "fullName": "Ahmed Hassan"
        },
        "debtor": {
          "_id": "65f...",
          "fullName": "Mohamed Ali"
        },
        "amount": 150.50,
        "status": "pending"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 95
    }
  }
}
```

---

#### Get Debt By ID

**GET** `/api/debts/:id`

Get detailed information about a specific debt.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/debts/65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Update Debt

**PATCH** `/api/debts/:id`

Update debt details (creditor only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 175.00,
  "description": "Updated description",
  "dueDate": "2024-02-15T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/api/debts/65f... \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 175.00
  }'
```

---

#### Settle Debt

**POST** `/api/debts/:id/settle`

Create a payment transaction to settle debt.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 150.50,
  "paymentMethod": "cash",
  "proofImage": "https://example.com/proof.jpg",
  "notes": "Paid in cash"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/debts/65f.../settle \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.50,
    "paymentMethod": "cash"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Payment transaction created",
  "data": {
    "transaction": {
      "_id": "65f...",
      "debt": "65f...",
      "amount": 150.50,
      "status": "pending_confirmation",
      "paymentMethod": "cash"
    },
    "debt": {
      "_id": "65f...",
      "status": "pending_settlement"
    }
  }
}
```

---

#### Add Note to Debt

**POST** `/api/debts/:id/notes`

Add a note/comment to a debt.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Reminder: payment due tomorrow"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/debts/65f.../notes \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Reminder: payment due tomorrow"
  }'
```

---

#### Delete Debt

**DELETE** `/api/debts/:id`

Soft delete a debt (creditor only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/debts/65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

---

#### Get Debt Statistics

**GET** `/api/debts/statistics`

Get debt statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `dormGroup` - Filter by dorm group ID (optional)

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/debts/statistics?dormGroup=65f..." \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalOwed": 450.00,
    "totalOwing": 200.00,
    "netBalance": 250.00,
    "byStatus": {
      "pending": 150.00,
      "confirmed": 300.00,
      "settled": 1000.00
    },
    "byCategory": {
      "food": 250.00,
      "utilities": 100.00,
      "rent": 100.00
    }
  }
}
```

---

### 4. Debt Resolution Endpoints

#### Resolve Group Debts

**GET** `/api/dorms/:id/resolve`

Get optimized debt resolution for a group (minimizes transactions).

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/dorms/65f.../resolve \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Debt resolution calculated successfully",
  "data": {
    "optimizedTransactions": [
      {
        "from": {
          "_id": "65f...",
          "fullName": "Mohamed Ali"
        },
        "to": {
          "_id": "65f...",
          "fullName": "Ahmed Hassan"
        },
        "amount": 150.50
      }
    ],
    "netBalances": {
      "65f...": 150.50,
      "65f...": -150.50
    },
    "summary": {
      "originalTransactionCount": 8,
      "optimizedTransactionCount": 3,
      "transactionsSaved": 5,
      "totalDebtAmount": 1250.00
    }
  }
}
```

---

#### Calculate Debt Between Two Users

**GET** `/api/debts/resolve/:user1Id/:user2Id`

Calculate net debt between two specific users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/debts/resolve/65f.../65f... \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Net debt calculated successfully",
  "data": {
    "user1": {
      "_id": "65f...",
      "fullName": "Ahmed Hassan"
    },
    "user2": {
      "_id": "65f...",
      "fullName": "Mohamed Ali"
    },
    "netDebt": 50.00,
    "direction": "user2 owes user1",
    "breakdown": {
      "user1OwesUser2": 100.00,
      "user2OwesUser1": 150.00
    }
  }
}
```

---

#### Get Group Summary

**GET** `/api/dorms/:id/summary`

Get comprehensive debt summary for a group.

**Headers:**
```
Authorization: Bearer <access_token>
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/dorms/65f.../summary \
  -H "Authorization: Bearer eyJhbGc..."
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group summary retrieved successfully",
  "data": {
    "group": {
      "_id": "65f...",
      "name": "Dorm 3A - Floor 2",
      "memberCount": 5
    },
    "totalDebts": 1250.00,
    "settledAmount": 300.00,
    "pendingAmount": 950.00,
    "userBalances": [
      {
        "user": {
          "_id": "65f...",
          "fullName": "Ahmed Hassan"
        },
        "netBalance": 250.00,
        "totalOwed": 450.00,
        "totalOwing": 200.00
      }
    ],
    "recentActivity": []
  }
}
```

---

## ⚠️ Error Handling

All errors follow a consistent format:

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "stack": "Error stack trace (development only)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🚦 Rate Limiting

**General API Endpoints:**
- Limit: 100 requests per 15 minutes
- Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

**Authentication Endpoints:**
- Limit: 5 requests per 15 minutes
- Applies to: `/api/auth/login`, `/api/auth/register`

**Debt Creation:**
- Limit: 20 requests per hour
- Applies to: `POST /api/debts`

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 900
}
```

---

## 🔧 Environment Variables

See `.env.example` for all required environment variables.

---

## 📦 Postman Collection

Import the Postman collection from `postman_collection.json` for pre-configured requests with environment variables.

---

## 🛠️ Development Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
copy .env.example .env
```

3. Update `.env` with your configuration

4. Seed database (optional):
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

---

## 📝 Notes

- All dates are in ISO 8601 format
- All monetary amounts use decimal numbers (e.g., 150.50)
- IDs are MongoDB ObjectIds
- Timestamps are automatically managed
- Soft deletes are used (isDeleted flag)
- All list endpoints support pagination
