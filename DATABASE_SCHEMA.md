# MongoDB Database Schema Documentation
## Dorm Debt Tracking System

---

## 📋 Table of Contents
1. [Schema Overview](#schema-overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Schema Definitions](#schema-definitions)
4. [Relationships](#relationships)
5. [Indexes and Performance](#indexes-and-performance)
6. [Design Decisions](#design-decisions)
7. [Usage Examples](#usage-examples)
8. [Future Enhancements](#future-enhancements)

---

## Schema Overview

This database schema supports a production-ready dorm debt tracking and resolution mobile application. The design focuses on:
- **Data integrity** through proper relationships and validation
- **Performance** through strategic indexing
- **Scalability** through denormalization where appropriate
- **Audit trails** through comprehensive history tracking
- **Flexibility** for future features

### Core Entities
1. **User** - Application users with authentication
2. **DormGroup** - Living groups/dorms containing multiple users
3. **Debt** - Individual debt records between users
4. **Transaction** - Payment/settlement records

---

## Entity-Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ _id (PK)        │
│ email           │◄─────────────┐
│ password        │              │
│ username        │              │
│ fullName        │              │
│ dormGroup (FK)  │──┐           │
│ role            │  │           │
│ isActive        │  │           │
│ ...             │  │           │
└─────────────────┘  │           │
                     │           │
                     │           │
                     ▼           │
         ┌─────────────────────┐│
         │     DormGroup       ││
         ├─────────────────────┤│
         │ _id (PK)            ││
         │ name                ││
         │ description         ││
         │ members[]           ││ (Array of User refs)
         │  ├─ user (FK) ──────┘
         │  ├─ role            │
         │  └─ joinedAt        │
         │ createdBy (FK)      │
         │ inviteCode          │
         │ settings            │
         │ statistics          │
         └─────────────────────┘
                     │
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│      Debt       │     │   Transaction   │
├─────────────────┤     ├─────────────────┤
│ _id (PK)        │     │ _id (PK)        │
│ creditor (FK)   │──┐  │ payer (FK)      │──┐
│ debtor (FK)     │  │  │ payee (FK)      │  │
│ dormGroup (FK)  │──┤  │ dormGroup (FK)  │──┤
│ originalAmount  │  │  │ amount          │  │
│ remainingAmount │  │  │ type            │  │
│ status          │  │  │ paymentMethod   │  │
│ category        │  │  │ status          │  │
│ dueDate         │  │  │ debts[]         │  │
│ transactions[]  │  │  │  ├─ debt (FK) ──┘  │
│ notes[]         │  │  │  └─ amountApplied  │
│ ...             │  │  │ confirmedBy (FK)   │
└─────────────────┘  │  │ ...                │
         ▲           │  └─────────────────────┘
         │           │
         └───────────┴─── All link back to DormGroup
```

### Cardinality:
- User **1:N** DormGroup (one user can belong to one group; one group has many users)
- User **1:N** Debt (one user can have many debts as creditor)
- User **1:N** Debt (one user can have many debts as debtor)
- User **1:N** Transaction (one user can have many transactions as payer/payee)
- DormGroup **1:N** Debt (one group has many debts)
- DormGroup **1:N** Transaction (one group has many transactions)
- Debt **N:M** Transaction (debts can be settled by multiple transactions; transactions can settle multiple debts)

---

## Schema Definitions

### 1. User Schema

**Purpose:** Stores user account information, authentication credentials, and profile data.

**Key Fields:**
```javascript
{
  // Authentication
  email: String (unique, indexed)
  password: String (hashed, select: false)
  username: String (unique, indexed)
  
  // Profile
  fullName: String
  phoneNumber: String
  profilePicture: String
  
  // Relationships
  dormGroup: ObjectId → DormGroup
  
  // Authorization
  role: ['member', 'admin', 'superadmin']
  
  // Status
  isActive: Boolean (soft delete)
  isEmailVerified: Boolean
  
  // Security
  loginAttempts: Number
  lockUntil: Date
  passwordResetToken: String
  
  // Preferences
  notificationSettings: {
    email: Boolean,
    push: Boolean,
    debtReminders: Boolean,
    paymentConfirmations: Boolean
  }
  
  // Metadata
  lastLogin: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Methods:**
- `comparePassword(candidatePassword)` - Verify password
- `incLoginAttempts()` - Track failed login attempts
- `resetLoginAttempts()` - Clear failed attempts
- Static: `findActive(filter)` - Find active users only
- Static: `findByCredential(credential)` - Find by email or username

**Middleware:**
- Pre-save: Hash password with bcrypt (salt rounds: 12)

**Indexes:**
- `email` (unique)
- `username` (unique)
- `{ email: 1, isActive: 1 }` (compound)
- `{ dormGroup: 1, isActive: 1 }` (compound)

---

### 2. DormGroup Schema

**Purpose:** Represents a shared living space (dorm, apartment) with multiple members.

**Key Fields:**
```javascript
{
  // Basic Info
  name: String (required)
  description: String
  avatar: String (URL)
  
  // Members
  members: [{
    user: ObjectId → User,
    role: ['admin', 'member'],
    joinedAt: Date,
    isActive: Boolean,
    leftAt: Date
  }]
  
  // Settings
  settings: {
    currency: String ['USD', 'EUR', 'EGP', ...],
    autoResolveDebts: Boolean,
    requireApprovalForDebts: Boolean,
    allowPartialPayments: Boolean,
    reminderFrequency: ['daily', 'weekly', 'monthly', 'never'],
    debtDueDateDefault: Number (days)
  }
  
  // Invite System
  inviteCode: String (unique, auto-generated)
  inviteExpiry: Date
  maxMembers: Number (default: 50)
  
  // Statistics (denormalized)
  statistics: {
    totalDebts: Number,
    totalTransactions: Number,
    totalAmount: Number,
    settledAmount: Number,
    lastActivityAt: Date
  }
  
  // Status
  isActive: Boolean
  isArchived: Boolean
  archivedAt: Date
  
  // Creator
  createdBy: ObjectId → User
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Virtuals:**
- `activeMembersCount` - Count of active members
- `adminCount` - Count of admins

**Methods:**
- `addMember(userId, role)` - Add new member to group
- `removeMember(userId)` - Remove member (soft delete)
- `updateMemberRole(userId, newRole)` - Change member role
- `isUserAdmin(userId)` - Check if user is admin
- `isUserMember(userId)` - Check if user is member
- `updateStatistics()` - Recalculate group statistics
- `regenerateInviteCode(expiryDays)` - Generate new invite code
- `isInviteValid()` - Check if invite is valid
- Static: `findByUser(userId)` - Find groups user belongs to

**Middleware:**
- Pre-save: Auto-generate invite code if not exists
- Pre-save: Validate at least one admin exists

**Indexes:**
- `inviteCode` (unique, sparse)
- `{ createdBy: 1, isActive: 1 }` (compound)
- `{ 'members.user': 1, isActive: 1 }` (compound)

---

### 3. Debt Schema

**Purpose:** Records individual debts between users in a group.

**Key Fields:**
```javascript
{
  // Parties
  creditor: ObjectId → User (who is owed)
  debtor: ObjectId → User (who owes)
  dormGroup: ObjectId → DormGroup
  
  // Amount
  originalAmount: Number (preserved for history)
  remainingAmount: Number (current balance)
  currency: String ['USD', 'EUR', 'EGP', ...]
  
  // Details
  description: String (required)
  category: ['food', 'utilities', 'rent', 'groceries', 
             'transportation', 'entertainment', 'supplies', 'other']
  
  // Status
  status: ['pending', 'partial', 'paid', 'cancelled', 'disputed']
  dueDate: Date
  paidAt: Date
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
  
  // Relations
  transactions: [ObjectId → Transaction]
  
  // Communication
  notes: [{
    user: ObjectId → User,
    content: String,
    createdAt: Date
  }]
  
  // Dispute
  dispute: {
    isDisputed: Boolean,
    reason: String,
    disputedBy: ObjectId → User,
    disputedAt: Date,
    resolvedAt: Date,
    resolution: String
  }
  
  // Metadata
  isDeleted: Boolean (soft delete)
  deletedAt: Date
  deletedBy: ObjectId → User
  reminderSent: Boolean
  lastReminderDate: Date
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Virtuals:**
- `isOverdue` - Check if debt is past due date
- `paymentProgress` - Calculate percentage paid (0-100)

**Methods:**
- `addNote(userId, content)` - Add note to debt
- `markAsPaid()` - Mark debt as fully paid
- `makePayment(amount)` - Record partial/full payment
- Static: `findActive(filter)` - Find non-deleted debts
- Static: `findOverdue()` - Find overdue debts
- Static: `calculateDebtBetweenUsers(user1Id, user2Id)` - Net debt calculation

**Middleware:**
- Pre-validate: Ensure creditor ≠ debtor
- Pre-save: Set remainingAmount = originalAmount on creation
- Pre-save: Auto-update status based on remainingAmount

**Indexes:**
- `{ creditor: 1, status: 1, isDeleted: 1 }` (compound)
- `{ debtor: 1, status: 1, isDeleted: 1 }` (compound)
- `{ dormGroup: 1, status: 1, isDeleted: 1 }` (compound)
- `{ status: 1, dueDate: 1 }` (compound, for overdue queries)
- `{ createdAt: -1 }` (recent debts)

---

### 4. Transaction Schema

**Purpose:** Records actual payment/settlement transactions between users.

**Key Fields:**
```javascript
{
  // Parties
  payer: ObjectId → User
  payee: ObjectId → User
  dormGroup: ObjectId → DormGroup
  
  // Amount
  amount: Number (required)
  currency: String
  
  // Type
  type: ['payment', 'settlement', 'refund', 'adjustment']
  
  // Related Debts
  debts: [{
    debt: ObjectId → Debt,
    amountApplied: Number
  }]
  
  // Payment Method
  paymentMethod: ['cash', 'bank_transfer', 'mobile_payment', 
                  'credit_card', 'debit_card', 'paypal', 'venmo', 'other']
  paymentDetails: {
    transactionId: String,
    accountLast4: String,
    notes: String
  }
  
  // Status Workflow
  status: ['pending', 'confirmed', 'rejected', 'cancelled', 'reversed']
  statusHistory: [{
    status: String,
    changedBy: ObjectId → User,
    changedAt: Date,
    reason: String
  }]
  
  // Verification
  confirmedBy: ObjectId → User
  confirmedAt: Date
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    type: ['receipt', 'screenshot', 'document', 'other'],
    uploadedAt: Date
  }]
  
  // Details
  description: String
  notes: String
  
  // Scheduled Payments
  isScheduled: Boolean
  scheduledDate: Date
  isRecurring: Boolean
  recurringPattern: {
    frequency: ['daily', 'weekly', 'monthly', 'yearly'],
    endDate: Date,
    nextOccurrence: Date
  }
  
  // Reversal
  isReversed: Boolean
  reversedAt: Date
  reversalReason: String
  reversalTransaction: ObjectId → Transaction
  originalTransaction: ObjectId → Transaction
  
  // Metadata
  ipAddress: String
  userAgent: String
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  }
  
  // Soft Delete
  isDeleted: Boolean
  deletedAt: Date
  deletedBy: ObjectId → User
  
  // Timestamps
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Virtuals:**
- `totalApplied` - Sum of amounts applied to debts
- `isFullyApplied` - Check if all amount is allocated to debts

**Methods:**
- `confirm(confirmerId)` - Confirm pending transaction & update debts
- `reject(reason, rejectedBy)` - Reject pending transaction
- `reverse(reason, reversedBy)` - Reverse confirmed transaction
- `addAttachment(filename, url, type)` - Add receipt/proof
- Static: `findActive(filter)` - Find non-deleted transactions
- Static: `findPending(filter)` - Find pending transactions
- Static: `calculateTransactionsBetweenUsers(user1Id, user2Id)` - Net transactions

**Middleware:**
- Pre-validate: Ensure payer ≠ payee
- Pre-save: Add status change to history
- Pre-save: Set confirmedAt when status changes to confirmed

**Indexes:**
- `{ payer: 1, status: 1, isDeleted: 1 }` (compound)
- `{ payee: 1, status: 1, isDeleted: 1 }` (compound)
- `{ dormGroup: 1, status: 1, createdAt: -1 }` (compound)
- `{ status: 1, scheduledDate: 1 }` (compound, for scheduled transactions)
- `{ 'debts.debt': 1 }` (debt lookups)
- `{ createdAt: -1 }` (recent transactions)

---

## Relationships

### One-to-Many Relationships

1. **User → Debts (as Creditor)**
   - One user can be owed money in many debts
   - Forward ref: `User.debts` (virtual, not stored)
   - Backward ref: `Debt.creditor`

2. **User → Debts (as Debtor)**
   - One user can owe money in many debts
   - Backward ref: `Debt.debtor`

3. **DormGroup → Users**
   - One group has many members
   - Forward ref: `DormGroup.members[]` (embedded array)
   - Backward ref: `User.dormGroup`

4. **DormGroup → Debts**
   - One group has many debts
   - Backward ref: `Debt.dormGroup`

5. **DormGroup → Transactions**
   - One group has many transactions
   - Backward ref: `Transaction.dormGroup`

### Many-to-Many Relationships

**Debt ↔ Transaction**
- A debt can be settled by multiple transactions (partial payments)
- A transaction can settle multiple debts (combined settlement)
- Implementation:
  - `Debt.transactions[]` - Array of Transaction ObjectIds
  - `Transaction.debts[]` - Array of {debt: ObjectId, amountApplied: Number}

---

## Indexes and Performance

### Index Strategy

1. **Unique Indexes** (enforce data integrity):
   - `User.email`
   - `User.username`
   - `DormGroup.inviteCode` (sparse)

2. **Single-Field Indexes** (simple queries):
   - `User.isActive`
   - `Debt.status`
   - `Transaction.status`

3. **Compound Indexes** (complex queries):
   - User queries: `{ email: 1, isActive: 1 }`
   - Group membership: `{ 'DormGroup.members.user': 1, isActive: 1 }`
   - Debt queries: `{ creditor: 1, status: 1, isDeleted: 1 }`
   - Transaction queries: `{ payer: 1, status: 1, isDeleted: 1 }`
   - Overdue debts: `{ status: 1, dueDate: 1 }`

4. **Descending Indexes** (recent items first):
   - `{ createdAt: -1 }` on Debts and Transactions

### Query Optimization Tips

```javascript
// ✅ Good: Uses compound index
Debt.find({ creditor: userId, status: 'pending', isDeleted: false })

// ✅ Good: Uses index on dueDate with status
Debt.find({ status: { $in: ['pending', 'partial'] }, dueDate: { $lt: new Date() } })

// ❌ Avoid: Full collection scan
Debt.find({ description: /groceries/i }) // Use text index if needed

// ✅ Better: Add text index first
debtSchema.index({ description: 'text' })
Debt.find({ $text: { $search: 'groceries' } })
```

---

## Design Decisions

### 1. Soft Deletes
**Decision:** Use `isDeleted` flag instead of hard deletes  
**Rationale:**
- Preserve audit trail and historical data
- Support undo operations
- Maintain referential integrity
- Compliance and legal requirements

**Implementation:**
```javascript
// Soft delete
debt.isDeleted = true;
debt.deletedAt = new Date();
debt.deletedBy = userId;
await debt.save();

// Query non-deleted
Debt.find({ isDeleted: false })
```

### 2. Embedded vs Referenced Data

**Embedded:**
- `DormGroup.members[]` - Frequently accessed together, limited size
- `DormGroup.settings` - Always loaded with group, single object
- `Debt.notes[]` - Bounded size, part of debt context
- `Transaction.attachments[]` - Small array, loaded with transaction

**Referenced:**
- `User.dormGroup` - User can switch groups
- `Debt.creditor/debtor` - Need full user info separately
- `Transaction.debts[]` - Debt objects are large and complex

**Rationale:** Embed when data is:
- Always accessed together
- Has bounded growth
- Doesn't need independent querying

### 3. Denormalization for Performance

**Statistics in DormGroup:**
```javascript
statistics: {
  totalDebts: Number,
  totalTransactions: Number,
  totalAmount: Number,
  settledAmount: Number,
  lastActivityAt: Date
}
```
**Rationale:**
- Dashboard requires quick aggregated data
- Calculating on-the-fly is expensive
- Update async or with job queue
- Trade consistency for read performance

### 4. Compound Indexes on Status Queries

Most queries filter by entity reference + status + soft delete:
```javascript
{ creditor: 1, status: 1, isDeleted: 1 }
```
**Rationale:**
- 90% of queries need all three filters
- Reduces query time from O(n) to O(log n)
- Worth the write overhead

### 5. Password Security

- Hashed with bcrypt (12 salt rounds)
- `select: false` on password field
- Separate method to explicitly load password
- Login attempt tracking with account locking

### 6. Flexible Payment Methods

Enum for common methods + 'other' option:
```javascript
paymentMethod: ['cash', 'bank_transfer', 'mobile_payment', ...]
paymentDetails: { flexible object }
```
**Rationale:**
- Different regions use different payment systems
- Details vary by method (transaction ID, account number, etc.)
- Extensible for future integrations

### 7. Transaction Confirmation Workflow

Status flow: `pending → confirmed → reversed`
**Rationale:**
- Prevents accidental payments
- Allows payee to verify before updating debts
- Supports dispute resolution
- Maintains trust in multi-party scenarios

---

## Usage Examples

### 1. User Registration and Group Creation

```javascript
// Create user
const user = await User.create({
  email: 'john@example.com',
  password: 'securePassword123',
  username: 'john_doe',
  fullName: 'John Doe',
  phoneNumber: '+1234567890'
});

// Create dorm group
const group = await DormGroup.create({
  name: 'Apartment 5B',
  description: 'CS students sharing apartment',
  createdBy: user._id,
  members: [
    { user: user._id, role: 'admin' }
  ],
  settings: {
    currency: 'USD',
    autoResolveDebts: true
  }
});

// Update user's group reference
user.dormGroup = group._id;
await user.save();
```

### 2. Creating a Debt

```javascript
const debt = await Debt.create({
  creditor: userId1,
  debtor: userId2,
  dormGroup: groupId,
  originalAmount: 50.00,
  currency: 'USD',
  description: 'Shared groceries from Walmart',
  category: 'groceries',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
});
```

### 3. Recording a Payment

```javascript
// Create transaction
const transaction = await Transaction.create({
  payer: userId2,
  payee: userId1,
  dormGroup: groupId,
  amount: 50.00,
  currency: 'USD',
  type: 'payment',
  paymentMethod: 'mobile_payment',
  debts: [
    { debt: debtId, amountApplied: 50.00 }
  ],
  description: 'Payment for groceries'
});

// Confirm transaction (updates debt automatically)
await transaction.confirm(userId1);
```

### 4. Calculate Net Debt Between Users

```javascript
const netDebt = await Debt.calculateDebtBetweenUsers(user1Id, user2Id);
// Returns: { netDebt: -25, user1Owes: 100, user2Owes: 75 }

if (netDebt.netDebt > 0) {
  console.log(`User 1 owes User 2: $${netDebt.netDebt}`);
} else if (netDebt.netDebt < 0) {
  console.log(`User 2 owes User 1: $${Math.abs(netDebt.netDebt)}`);
}
```

### 5. Find Overdue Debts

```javascript
const overdueDebts = await Debt.findOverdue();

// Send reminders
for (const debt of overdueDebts) {
  await debt.populate('debtor creditor');
  // sendReminderEmail(debt.debtor.email, debt);
}
```

### 6. Add Member to Group

```javascript
await group.addMember(newUserId, 'member');
// This also updates the user's dormGroup field
```

### 7. Group Statistics Dashboard

```javascript
const group = await DormGroup.findById(groupId)
  .populate('members.user', 'username fullName profilePicture');

console.log(`Total Debts: ${group.statistics.totalDebts}`);
console.log(`Total Amount: $${group.statistics.totalAmount}`);
console.log(`Settled: $${group.statistics.settledAmount}`);
console.log(`Active Members: ${group.activeMembersCount}`);
```

---

## Future Enhancements

### 1. Debt Resolution Algorithm

**Circular Debt Resolution:**
Implement algorithm to simplify multi-party debts:
```
A owes B $100
B owes C $100
C owes A $100
→ Simplify to: All debts cancelled
```

**Implementation approach:**
- Create new model: `DebtResolution`
- Run algorithm periodically or on-demand
- Store optimization results
- Create settlement transactions

### 2. Notification System

Add to existing schemas:
```javascript
// User notifications
notifications: [{
  type: ['debt_created', 'payment_received', 'reminder', 'group_activity'],
  title: String,
  message: String,
  relatedDebt: ObjectId,
  relatedTransaction: ObjectId,
  isRead: Boolean,
  createdAt: Date
}]
```

### 3. Payment Integration

Add payment gateway integration:
```javascript
// Transaction model additions
paymentGateway: {
  provider: ['stripe', 'paypal', 'square'],
  gatewayTransactionId: String,
  gatewayStatus: String,
  gatewayResponse: Object,
  webhookReceived: Boolean
}
```

### 4. Monthly Reports

New model for automated reports:
```javascript
const reportSchema = new Schema({
  dormGroup: { type: ObjectId, ref: 'DormGroup' },
  period: {
    year: Number,
    month: Number
  },
  summary: {
    totalDebtsCreated: Number,
    totalAmountOwed: Number,
    totalAmountSettled: Number,
    participantCount: Number
  },
  userSummaries: [{
    user: ObjectId,
    totalOwed: Number,
    totalReceived: Number,
    netPosition: Number,
    debtCount: Number,
    transactionCount: Number
  }],
  generatedAt: Date
});
```

### 5. File Upload System

For receipts and attachments:
- Integrate with AWS S3, Google Cloud Storage, or similar
- Add file validation and virus scanning
- Implement signed URLs for secure access
- Add file size limits and quotas

### 6. Advanced Search

Add text search indexes:
```javascript
debtSchema.index({
  description: 'text',
  'notes.content': 'text'
});

// Full-text search
Debt.find({ $text: { $search: 'groceries walmart' } })
```

### 7. Multi-Currency Support

Enhance currency handling:
```javascript
// Add to DormGroup settings
currencyExchange: {
  enabled: Boolean,
  baseCurrency: String,
  rates: Map // Store exchange rates
}

// Add to Debt/Transaction
originalCurrency: String,
convertedAmount: Number,
exchangeRate: Number,
conversionDate: Date
```

### 8. Dispute Resolution Workflow

Enhance dispute system:
- Add mediator role in group
- Create timeline for dispute lifecycle
- Add evidence attachment
- Implement voting system for group disputes

### 9. Analytics and Insights

Create analytics collection:
```javascript
const analyticsSchema = new Schema({
  dormGroup: ObjectId,
  date: Date,
  metrics: {
    activeUsers: Number,
    debtsCreated: Number,
    debtsResolved: Number,
    avgDebtAmount: Number,
    avgResolutionTime: Number,
    mostActiveUser: ObjectId,
    popularCategories: [String]
  }
});
```

### 10. Audit Logs

Comprehensive audit trail:
```javascript
const auditLogSchema = new Schema({
  user: ObjectId,
  action: String,
  entityType: String,
  entityId: ObjectId,
  changes: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
});
```

---

## Best Practices

### 1. Always Use Transactions for Critical Operations

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  await transaction.confirm(userId, { session });
  await debt.makePayment(amount, { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 2. Populate Sparingly

```javascript
// ❌ Bad: Over-populating
Debt.find().populate('creditor debtor dormGroup transactions')

// ✅ Good: Only populate what you need
Debt.find().populate('creditor', 'username fullName')
```

### 3. Use Lean Queries for Read-Only Operations

```javascript
// ✅ Faster for read-only
const debts = await Debt.find().lean();

// ❌ Slower, but needed if you'll call methods
const debts = await Debt.find(); // Full Mongoose documents
```

### 4. Batch Operations

```javascript
// ✅ Good: Bulk insert
await Debt.insertMany(debtsArray);

// ❌ Bad: Individual inserts
for (const debt of debtsArray) {
  await Debt.create(debt);
}
```

### 5. Implement Proper Error Handling

```javascript
try {
  await debt.makePayment(amount);
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
  } else if (error.message.includes('exceeds remaining')) {
    // Handle business logic errors
  } else {
    // Handle unexpected errors
  }
}
```

---

## Conclusion

This schema provides a solid foundation for a production-ready dorm debt tracking application with:

✅ **Data Integrity** - Proper validation and relationships  
✅ **Performance** - Strategic indexing and denormalization  
✅ **Security** - Password hashing, soft deletes, audit trails  
✅ **Scalability** - Modular design, extensible schemas  
✅ **User Experience** - Rich features like disputes, notifications, settlements  
✅ **Maintainability** - Clear documentation, consistent patterns  

The design balances immediate requirements with future extensibility, making it suitable for MVP launch while supporting growth and feature additions.
