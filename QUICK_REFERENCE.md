# 🚀 Quick Reference Card

## Server Commands

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Seed database
npm run seed
```

## API Base URL
```
http://localhost:3000/api
```

## Authentication Flow

```
1. Register:  POST /auth/register
   ↓
2. Login:     POST /auth/login (get tokens)
   ↓
3. Use API:   Include header: Authorization: Bearer {access_token}
   ↓
4. Refresh:   POST /auth/refresh-token (when token expires)
```

## Common Endpoints

### Auth
- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `GET /auth/me` - Get profile (requires auth)

### Dorms
- `POST /dorms` - Create group (requires auth)
- `POST /dorms/join` - Join group (requires auth)
- `GET /dorms/my-groups` - My groups (requires auth)
- `GET /dorms/:id` - Group details (requires auth + member)

### Debts
- `POST /debts` - Create debt (requires auth)
- `GET /debts` - List debts (requires auth)
- `POST /debts/:id/settle` - Settle debt (requires auth)

### Resolution
- `GET /dorms/:id/resolve` - Optimize debts (requires auth + member)

## Quick Test

### 1. Register
```json
POST /api/auth/register
{
  "username": "test_user",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "fullName": "Test User"
}
```

### 2. Login
```json
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```
**Save the `accessToken` from response!**

### 3. Create Group
```json
POST /api/dorms
Headers: Authorization: Bearer {your_token}
{
  "name": "My Dorm",
  "description": "Test group"
}
```
**Save the `_id` from response!**

### 4. Create Debt
```json
POST /api/debts
Headers: Authorization: Bearer {your_token}
{
  "debtor": "{another_user_id}",
  "dormGroup": "{dorm_id_from_step_3}",
  "amount": 50.00,
  "category": "food",
  "description": "Lunch"
}
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `429` - Too Many Requests (rate limit)
- `500` - Server Error

## Rate Limits

- **API endpoints:** 100 requests / 15 min
- **Auth endpoints:** 5 requests / 15 min
- **Debt creation:** 20 requests / hour

## Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dorm-debt-tracker
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
```

## Seeded Users (after `npm run seed`)

```
Email: user1@example.com
Password: Password123!

Email: user2@example.com
Password: Password123!

Email: user3@example.com
Password: Password123!

Email: user4@example.com
Password: Password123!

Email: user5@example.com
Password: Password123!
```

## Postman Setup

1. Import `postman_collection.json`
2. Create environment
3. Add variable: `base_url` = `http://localhost:3000/api`
4. Run "Register" or "Login" (tokens auto-save)
5. Test other endpoints

## Debt Resolution Example

**Before:**
- Ahmed → Mohamed: $50
- Mohamed → Sara: $30
- Sara → Ahmed: $20

**After calling `/dorms/:id/resolve`:**
- Ahmed → Mohamed: $30
- (2 transactions eliminated!)

## Documentation Files

- `API_DOCUMENTATION.md` - Complete API reference
- `IMPLEMENTATION_COMPLETE.md` - Full project guide
- `TESTING_GUIDE.md` - Testing instructions
- `postman_collection.json` - Postman collection

## Troubleshooting

**MongoDB not connected?**
```bash
net start MongoDB
```

**Token expired?**
```
POST /api/auth/refresh-token
Body: { "refreshToken": "..." }
```

**Rate limited?**
Wait 15 minutes and try again

## Health Check

```
GET http://localhost:3000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running"
}
```

---

**Need more help?** See [TESTING_GUIDE.md](TESTING_GUIDE.md)
