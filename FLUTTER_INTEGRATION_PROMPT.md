# Flutter Integration Prompt for GitHub Copilot

Copy and paste this prompt to GitHub Copilot to build the Flutter app integration:

---

## 📱 Prompt for Copilot:

I need you to help me build a complete Flutter mobile app that integrates with my existing REST API for a dorm debt tracking and resolution application.

### 🎯 Project Context

I have a production-ready Node.js/Express REST API with MongoDB backend that handles:
- User authentication with JWT (access + refresh tokens)
- Dorm group management with invite codes
- Debt tracking between group members
- Automatic debt resolution using a greedy algorithm
- Transaction/payment management

**API Base URL:** `https://hato-production.up.railway.app/api` (development)

### 📋 What I Need You to Build

#### 1. **API Integration Layer**

Create a complete API service layer with:

**HTTP Client Setup:**
- Use `dio` package for HTTP requests
- Implement interceptors for:
  - Automatic JWT token attachment (Bearer token in Authorization header)
  - Automatic token refresh when 401 error occurs
  - Error handling and logging
  - Request/response logging (debug mode only)

**Authentication Service (`lib/services/auth_service.dart`):**
```dart
// Methods needed:
- Future<AuthResponse> register({username, email, password, fullName, phoneNumber})
- Future<AuthResponse> login({email, password})
- Future<void> logout()
- Future<String> refreshAccessToken(String refreshToken)
- Future<User> getCurrentUser()
- Future<User> updateProfile({fullName, phoneNumber, profilePicture})
- Future<void> changePassword({currentPassword, newPassword})
```

**Dorm Group Service (`lib/services/dorm_service.dart`):**
```dart
// Methods needed:
- Future<DormGroup> createGroup({name, description, settings})
- Future<DormGroup> joinGroup(String inviteCode)
- Future<List<DormGroup>> getMyGroups()
- Future<DormGroup> getGroupDetails(String groupId)
- Future<DormGroup> updateGroup(String groupId, {name, description, settings})
- Future<void> removeGroupMember(String groupId, String userId)
- Future<void> leaveGroup(String groupId)
- Future<void> deleteGroup(String groupId)
- Future<String> regenerateInviteCode(String groupId)
- Future<void> updateMemberRole(String groupId, String userId, String role)
- Future<DebtResolution> resolveGroupDebts(String groupId)
- Future<GroupSummary> getGroupSummary(String groupId)
```

**Debt Service (`lib/services/debt_service.dart`):**
```dart
// Methods needed:
- Future<Debt> createDebt({debtor, dormGroup, amount, category, description, dueDate})
- Future<PaginatedResponse<Debt>> getDebts({page, limit, status, category, dormGroup, creditor, debtor})
- Future<Debt> getDebtById(String debtId)
- Future<Debt> updateDebt(String debtId, {amount, description, dueDate})
- Future<TransactionResponse> settleDebt(String debtId, {amount, paymentMethod, proofImage, notes})
- Future<Debt> addNoteToDebt(String debtId, String content)
- Future<void> deleteDebt(String debtId)
- Future<DebtStatistics> getStatistics({String? dormGroup})
- Future<NetDebt> calculateNetDebtBetweenUsers(String user1Id, String user2Id)
```

#### 2. **Data Models**

Create Dart models that match the API responses with:
- `fromJson` factory constructors
- `toJson` methods
- Null safety
- Proper date/time handling (use `DateTime.parse()`)

**Models needed (`lib/models/`):**

**user.dart:**
```dart
class User {
  final String id;
  final String username;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String? profilePicture;
  final DateTime createdAt;
  final DateTime? lastLogin;
  
  // fromJson, toJson, copyWith
}
```

**auth_response.dart:**
```dart
class AuthResponse {
  final User user;
  final Tokens tokens;
  
  // fromJson, toJson
}

class Tokens {
  final String accessToken;
  final String refreshToken;
  
  // fromJson, toJson
}
```

**dorm_group.dart:**
```dart
class DormGroup {
  final String id;
  final String name;
  final String description;
  final String inviteCode;
  final List<GroupMember> members;
  final GroupSettings settings;
  final GroupStats? stats;
  final DateTime createdAt;
  
  // fromJson, toJson, copyWith
}

class GroupMember {
  final User user;
  final String role; // 'admin' or 'member'
  final DateTime joinedAt;
  
  // fromJson, toJson
}

class GroupSettings {
  final bool requireApprovalForDebts;
  final bool allowNegativeBalances;
  final bool autoResolveDebts;
  
  // fromJson, toJson
}

class GroupStats {
  final double totalDebts;
  final double settledDebts;
  final double pendingDebts;
  
  // fromJson, toJson
}
```

**debt.dart:**
```dart
class Debt {
  final String id;
  final User creditor;
  final User debtor;
  final DormGroup dormGroup;
  final double amount;
  final String status; // 'pending', 'confirmed', 'disputed', 'settled'
  final String category; // 'food', 'utilities', 'rent', 'supplies', 'entertainment', 'transport', 'other'
  final String description;
  final DateTime? dueDate;
  final List<DebtNote> notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // fromJson, toJson, copyWith
}

class DebtNote {
  final String author;
  final String content;
  final DateTime timestamp;
  
  // fromJson, toJson
}
```

**transaction.dart:**
```dart
class Transaction {
  final String id;
  final String debt;
  final double amount;
  final String status; // 'pending_confirmation', 'confirmed', 'disputed', 'reversed'
  final String paymentMethod; // 'cash', 'bank_transfer', 'mobile_payment', 'other'
  final String? proofImage;
  final String? notes;
  final DateTime createdAt;
  
  // fromJson, toJson
}
```

**debt_resolution.dart:**
```dart
class DebtResolution {
  final List<OptimizedTransaction> optimizedTransactions;
  final Map<String, double> netBalances;
  final ResolutionSummary summary;
  
  // fromJson, toJson
}

class OptimizedTransaction {
  final User from;
  final User to;
  final double amount;
  
  // fromJson, toJson
}

class ResolutionSummary {
  final int originalTransactionCount;
  final int optimizedTransactionCount;
  final int transactionsSaved;
  final double totalDebtAmount;
  
  // fromJson, toJson
}
```

**paginated_response.dart:**
```dart
class PaginatedResponse<T> {
  final List<T> items;
  final Pagination pagination;
  
  // fromJson with generic type handling
}

class Pagination {
  final int page;
  final int limit;
  final int totalPages;
  final int totalItems;
  
  // fromJson, toJson
}
```

**api_response.dart:**
```dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final List<ApiError>? errors;
  
  // fromJson with generic type handling
}

class ApiError {
  final String? field;
  final String message;
  
  // fromJson
}
```

#### 3. **State Management**

Use **Provider** or **Riverpod** (your choice) for state management:

**Authentication State:**
- Store current user
- Store tokens (access + refresh)
- Handle login/logout state
- Persist tokens securely (use `flutter_secure_storage`)

**Group State:**
- Cache user's groups
- Current selected group
- Handle group updates

**Debt State:**
- Debt list with pagination
- Filters (status, category, etc.)
- Debt statistics

#### 4. **Secure Storage**

Implement secure token storage using `flutter_secure_storage`:

**Storage Service (`lib/services/storage_service.dart`):**
```dart
class StorageService {
  // Save/retrieve access token
  // Save/retrieve refresh token
  // Save/retrieve user data
  // Clear all data on logout
}
```

#### 5. **Error Handling**

Create a comprehensive error handling system:

**Custom Exceptions (`lib/exceptions/`):**
```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final List<ApiError>? errors;
  
  // Different exception types:
  // - UnauthorizedException (401)
  // - ForbiddenException (403)
  // - NotFoundException (404)
  // - ValidationException (400)
  // - RateLimitException (429)
  // - ServerException (500)
}
```

#### 6. **API Constants**

**lib/core/constants/api_constants.dart:**
```dart
class ApiConstants {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Auth endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refreshToken = '/auth/refresh-token';
  static const String me = '/auth/me';
  // ... all other endpoints
  
  // Request timeout
  static const Duration timeout = Duration(seconds: 30);
}
```

#### 7. **Dio Interceptor**

**lib/core/network/dio_interceptor.dart:**
```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Add Bearer token to all requests
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Handle 401: try to refresh token
    // If refresh fails: logout user
    // Handle other errors: convert to ApiException
  }
}
```

#### 8. **Dependency Injection**

Set up service locator using `get_it`:

**lib/core/di/service_locator.dart:**
```dart
final getIt = GetIt.instance;

void setupServiceLocator() {
  // Register Dio
  getIt.registerLazySingleton<Dio>(() => createDio());
  
  // Register services
  getIt.registerLazySingleton<StorageService>(() => StorageService());
  getIt.registerLazySingleton<AuthService>(() => AuthService(getIt()));
  getIt.registerLazySingleton<DormService>(() => DormService(getIt()));
  getIt.registerLazySingleton<DebtService>(() => DebtService(getIt()));
}
```

### 📝 API Details

#### Authentication:
- **All protected endpoints** require: `Authorization: Bearer {access_token}`
- **Access token expires** in 15 minutes
- **Refresh token** to get new access token when it expires
- **Handle 401 errors** by refreshing token automatically

#### Response Format:
All API responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": [
    {"field": "email", "message": "Email is required"}
  ]
}
```

#### Pagination:
List endpoints return:
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 95
    }
  }
}
```

#### Rate Limiting:
- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes
- Debt creation: 20 requests / hour

Handle 429 errors gracefully with retry logic.

#### Status Codes:
- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate)
- 429: Rate limit exceeded
- 500: Server error

### 🔧 Required Flutter Packages

Add these to `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP & Networking
  dio: ^5.4.0
  
  # State Management (choose one)
  provider: ^6.1.1
  # OR
  flutter_riverpod: ^2.4.9
  
  # Secure Storage
  flutter_secure_storage: ^9.0.0
  
  # Dependency Injection
  get_it: ^7.6.4
  
  # JSON Serialization (optional but recommended)
  json_annotation: ^4.8.1
  
  # Loading indicators
  flutter_spinkit: ^5.2.0
  
  # Date formatting
  intl: ^0.18.1

dev_dependencies:
  # JSON code generation (if using json_annotation)
  build_runner: ^2.4.6
  json_serializable: ^6.7.1
```

### 🎨 Additional Features to Implement

1. **Pull-to-refresh** for lists
2. **Infinite scroll** for paginated lists
3. **Offline caching** (optional, use `hive` or `sqflite`)
4. **Loading states** for all async operations
5. **Error snackbars** for user feedback
6. **Retry mechanism** for failed requests
7. **Network connectivity check** before API calls
8. **Form validation** matching API Joi schemas

### 📱 Example API Calls

**Register:**
```dart
POST /api/auth/register
{
  "username": "ahmed_123",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "fullName": "Ahmed Hassan"
}
```

**Login:**
```dart
POST /api/auth/login
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

**Create Group:**
```dart
POST /api/dorms
Headers: Authorization: Bearer {token}
{
  "name": "Dorm 3A - Floor 2",
  "description": "Engineering students"
}
```

**Get Debts with filters:**
```dart
GET /api/debts?page=1&limit=20&status=pending&dormGroup={groupId}
Headers: Authorization: Bearer {token}
```

**Resolve Group Debts:**
```dart
GET /api/dorms/{groupId}/resolve
Headers: Authorization: Bearer {token}
```

### 🚀 Implementation Priority

Build in this order:
1. ✅ Models with fromJson/toJson
2. ✅ Storage service for secure token storage
3. ✅ Dio setup with interceptors
4. ✅ Authentication service + state management
5. ✅ Auth screens (login, register)
6. ✅ Dorm service + Group screens
7. ✅ Debt service + Debt screens
8. ✅ Debt resolution feature
9. ✅ Error handling and loading states
10. ✅ Polish UI/UX

### 📚 Reference

Full API documentation is available in the backend repository at:
- `API_DOCUMENTATION.md` - Complete endpoint reference
- `postman_collection.json` - Test API with Postman first

### 🎯 Quality Requirements

- ✅ Use null safety throughout
- ✅ Handle all error cases gracefully
- ✅ Show loading indicators for async operations
- ✅ Implement proper logout (clear tokens, navigate to login)
- ✅ Validate forms before sending to API
- ✅ Show user-friendly error messages
- ✅ Use consistent code style (follow Flutter conventions)
- ✅ Add comments for complex logic
- ✅ Test token refresh flow thoroughly

### 🔐 Security Considerations

- ✅ Store tokens in secure storage (not SharedPreferences)
- ✅ Clear tokens on logout
- ✅ Handle token expiration gracefully
- ✅ Use HTTPS in production
- ✅ Never log sensitive data (tokens, passwords)
- ✅ Validate SSL certificates
- ✅ Implement certificate pinning (production)

---

## 🎯 Your Task

Please help me build this Flutter integration following the structure above. Start with:
1. Creating the folder structure
2. Setting up Dio with interceptors
3. Building all data models
4. Implementing authentication service
5. Setting up state management

Provide production-ready, well-documented code with proper error handling and state management. Use modern Flutter best practices and ensure type safety throughout.

---

**Ready when you are! Let's build this app! 🚀**
