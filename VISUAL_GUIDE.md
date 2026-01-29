# 🗺️ Database Entity Relationship Visual Guide

## Quick Reference Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         DORM DEBT TRACKING SYSTEM                       │
│                         Database Schema Overview                        │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              USER MODEL                                  │
├──────────────────────┬──────────────────────────────────────────────────┤
│ Core Fields          │ Security Fields         │ Relationships          │
├──────────────────────┼─────────────────────────┼────────────────────────┤
│ • _id                │ • password (hashed)     │ → dormGroup (FK)       │
│ • email (unique)     │ • loginAttempts         │ → debts as creditor    │
│ • username (unique)  │ • lockUntil             │ → debts as debtor      │
│ • fullName           │ • passwordResetToken    │ → transactions payer   │
│ • phoneNumber        │ • emailVerificationTkn  │ → transactions payee   │
│ • profilePicture     │ • isActive              │                        │
│ • role               │ • isEmailVerified       │                        │
│ • lastLogin          │                         │                        │
├──────────────────────┴─────────────────────────┴────────────────────────┤
│ Methods: comparePassword(), incLoginAttempts(), resetLoginAttempts()    │
│ Statics: findActive(), findByCredential()                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:1 belongsTo
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DORM GROUP MODEL                               │
├──────────────────────┬──────────────────────────────────────────────────┤
│ Core Fields          │ Settings                │ Statistics             │
├──────────────────────┼─────────────────────────┼────────────────────────┤
│ • _id                │ • currency              │ • totalDebts           │
│ • name               │ • autoResolveDebts      │ • totalTransactions    │
│ • description        │ • requireApproval       │ • totalAmount          │
│ • avatar             │ • allowPartialPayments  │ • settledAmount        │
│ • inviteCode (unique)│ • reminderFrequency     │ • lastActivityAt       │
│ • inviteExpiry       │ • debtDueDateDefault    │                        │
│ • maxMembers         │                         │                        │
│ • isActive           │                         │                        │
│ • isArchived         │                         │                        │
│ • createdBy (FK)     │                         │                        │
├──────────────────────┴─────────────────────────┴────────────────────────┤
│ Members Array: [{ user: FK, role: ['admin','member'], joinedAt, ... }] │
├─────────────────────────────────────────────────────────────────────────┤
│ Methods: addMember(), removeMember(), updateMemberRole(),               │
│          isUserAdmin(), updateStatistics(), regenerateInviteCode()      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ 1:N hasMany                   │ 1:N hasMany
                    ▼                               ▼
┌──────────────────────────────────┐    ┌───────────────────────────────┐
│         DEBT MODEL               │    │      TRANSACTION MODEL        │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Parties                          │    │ Parties                       │
│ • creditor (FK) → User           │    │ • payer (FK) → User           │
│ • debtor (FK) → User             │    │ • payee (FK) → User           │
│ • dormGroup (FK)                 │    │ • dormGroup (FK)              │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Amount                           │    │ Amount                        │
│ • originalAmount                 │    │ • amount                      │
│ • remainingAmount                │    │ • currency                    │
│ • currency                       │    │ • type                        │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Details                          │    │ Payment                       │
│ • description                    │    │ • paymentMethod               │
│ • category (enum)                │    │ • paymentDetails{}            │
│ • status (enum)                  │    │ • status (enum)               │
│ • dueDate                        │    │ • confirmedBy (FK)            │
│ • paidAt                         │    │ • confirmedAt                 │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Arrays                           │    │ Arrays                        │
│ • attachments[]                  │    │ • debts[{debt,amountApplied}] │
│ • transactions[] (FK)            │◄───│ • statusHistory[]             │
│ • notes[{user,content,date}]     │N:M │ • attachments[]               │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Metadata                         │    │ Reversal                      │
│ • isDeleted                      │    │ • isReversed                  │
│ • reminderSent                   │    │ • reversalTransaction (FK)    │
│ • dispute{}                      │    │ • originalTransaction (FK)    │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Virtuals:                        │    │ Virtuals:                     │
│ • isOverdue                      │    │ • totalApplied                │
│ • paymentProgress                │    │ • isFullyApplied              │
├──────────────────────────────────┤    ├───────────────────────────────┤
│ Methods:                         │    │ Methods:                      │
│ • addNote()                      │    │ • confirm()                   │
│ • markAsPaid()                   │    │ • reject()                    │
│ • makePayment()                  │    │ • reverse()                   │
│                                  │    │ • addAttachment()             │
│ Statics:                         │    │                               │
│ • findOverdue()                  │    │ Statics:                      │
│ • calculateDebtBetweenUsers()    │    │ • findPending()               │
└──────────────────────────────────┘    └───────────────────────────────┘
```

---

## Status Flow Diagrams

### Debt Status Lifecycle
```
    CREATE
       │
       ▼
  ┌─────────┐
  │ PENDING │ ◄───────────────┐
  └────┬────┘                 │
       │                      │
       │ Partial Payment      │ Add More Debt
       ▼                      │
  ┌─────────┐                 │
  │ PARTIAL │ ────────────────┘
  └────┬────┘
       │
       │ Full Payment
       ▼
  ┌─────────┐
  │  PAID   │
  └─────────┘

  Alternative Paths:
  PENDING → CANCELLED (by user)
  PENDING/PARTIAL → DISPUTED (raise dispute)
  DISPUTED → PENDING (resolve dispute)
```

### Transaction Status Workflow
```
    CREATE
       │
       ▼
  ┌─────────┐
  │ PENDING │ ◄─┐
  └────┬────┘   │
       │        │
   ┌───┴────┐   │
   │        │   │
   ▼        ▼   │
CONFIRM  REJECT  │
   │             │
   ▼             │
┌──────────┐     │
│CONFIRMED │     │
└────┬─────┘     │
     │           │
     │ Reverse   │
     ▼           │
┌──────────┐     │
│REVERSED  │─────┘
└──────────┘

Alternative:
PENDING → CANCELLED (by user)
```

---

## Index Strategy Visual

### User Indexes
```
email ─────────────► UNIQUE INDEX
username ──────────► UNIQUE INDEX
{email + isActive} ► COMPOUND INDEX (for active user lookups)
{dormGroup + isActive} ► COMPOUND INDEX (for group member queries)
```

### DormGroup Indexes
```
inviteCode ────────► UNIQUE SPARSE INDEX
{createdBy + isActive} ► COMPOUND INDEX
{members.user + isActive} ► COMPOUND INDEX (for user's groups)
```

### Debt Indexes
```
{creditor + status + isDeleted} ► COMPOUND INDEX (creditor's debts)
{debtor + status + isDeleted} ► COMPOUND INDEX (debtor's debts)
{dormGroup + status + isDeleted} ► COMPOUND INDEX (group debts)
{status + dueDate} ► COMPOUND INDEX (overdue debt queries)
createdAt ► DESC INDEX (recent debts first)
```

### Transaction Indexes
```
{payer + status + isDeleted} ► COMPOUND INDEX
{payee + status + isDeleted} ► COMPOUND INDEX
{dormGroup + status + createdAt} ► COMPOUND INDEX
{debts.debt} ► INDEX (debt payment history)
createdAt ► DESC INDEX (recent transactions first)
```

---

## Common Query Patterns

### 1. User Dashboard
```javascript
// Get user's active dorm group
DormGroup.findById(user.dormGroup)
  .populate('members.user', 'username fullName profilePicture')

// Get debts user owes (as debtor)
Debt.find({ 
  debtor: userId, 
  status: { $in: ['pending', 'partial'] },
  isDeleted: false 
})

// Get debts owed to user (as creditor)
Debt.find({ 
  creditor: userId,
  status: { $in: ['pending', 'partial'] },
  isDeleted: false 
})

// Get recent transactions
Transaction.find({
  $or: [{ payer: userId }, { payee: userId }],
  isDeleted: false
}).sort({ createdAt: -1 }).limit(10)
```

### 2. Group Dashboard
```javascript
// Get group with members
DormGroup.findById(groupId)
  .populate('members.user')

// Get all group debts
Debt.find({ 
  dormGroup: groupId,
  isDeleted: false 
})

// Get overdue debts in group
Debt.find({
  dormGroup: groupId,
  status: { $in: ['pending', 'partial'] },
  dueDate: { $lt: new Date() },
  isDeleted: false
})

// Get group statistics (already denormalized)
group.statistics // Fast access!
```

### 3. Net Debt Calculation
```javascript
// Calculate who owes whom between two users
const netDebt = await Debt.calculateDebtBetweenUsers(user1Id, user2Id);

// Returns:
{
  netDebt: -25,      // Negative = user2 owes user1
  user1Owes: 100,    // User1's total debt to user2
  user2Owes: 75      // User2's total debt to user1
}
```

### 4. Payment Recording
```javascript
// 1. Create transaction
const txn = await Transaction.create({
  payer: debtorId,
  payee: creditorId,
  amount: 50,
  debts: [{ debt: debtId, amountApplied: 50 }],
  paymentMethod: 'cash'
});

// 2. Confirm transaction (auto-updates debt)
await txn.confirm(creditorId);

// Behind the scenes:
// - Debt.remainingAmount reduced by 50
// - Debt.status updated (paid if remainingAmount = 0)
// - Transaction added to debt.transactions[]
```

---

## Data Flow Example

### Scenario: User Creates and Settles a Debt

```
Step 1: Create Debt
┌──────────┐
│  Ahmed   │ owes 50 EGP to Mohamed for groceries
└────┬─────┘
     │ POST /api/debts
     ▼
┌─────────────────────────────────┐
│ Debt Created:                   │
│ - creditor: Mohamed             │
│ - debtor: Ahmed                 │
│ - originalAmount: 50            │
│ - remainingAmount: 50           │
│ - status: pending               │
└─────────────────────────────────┘

Step 2: Record Payment
┌──────────┐
│  Ahmed   │ pays 50 EGP to Mohamed
└────┬─────┘
     │ POST /api/transactions
     ▼
┌─────────────────────────────────┐
│ Transaction Created:            │
│ - payer: Ahmed                  │
│ - payee: Mohamed                │
│ - amount: 50                    │
│ - status: pending               │
│ - debts: [{ debt: id, amt: 50}] │
└─────────────────────────────────┘

Step 3: Confirm Payment
┌──────────┐
│ Mohamed  │ confirms receipt
└────┬─────┘
     │ PUT /api/transactions/:id/confirm
     ▼
┌─────────────────────────────────┐
│ Transaction Updated:            │
│ - status: confirmed             │
│ - confirmedBy: Mohamed          │
│ - confirmedAt: now()            │
└──────────┬──────────────────────┘
           │
           │ Auto-triggers:
           ▼
┌─────────────────────────────────┐
│ Debt Updated:                   │
│ - remainingAmount: 0            │
│ - status: paid                  │
│ - paidAt: now()                 │
│ - transactions: [txnId]         │
└─────────────────────────────────┘

Result: Debt fully settled! ✓
```

---

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                     REQUEST FROM CLIENT                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 1: INPUT VALIDATION                                       │
│ - Mongoose validators                                           │
│ - Custom validation rules                                       │
│ - Type checking                                                 │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 2: AUTHENTICATION                                         │
│ - JWT verification (to be implemented)                          │
│ - User lookup                                                   │
│ - Account status check (isActive, isLocked)                     │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 3: AUTHORIZATION                                          │
│ - Check user role                                               │
│ - Verify group membership                                       │
│ - Check resource ownership                                      │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 4: BUSINESS LOGIC                                         │
│ - Model methods                                                 │
│ - Pre-save middleware                                           │
│ - Validation logic                                              │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 5: DATABASE                                               │
│ - Unique indexes enforced                                       │
│ - Referential integrity                                         │
│ - Atomic operations                                             │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 6: AUDIT TRAIL                                            │
│ - Status history logged                                         │
│ - Soft deletes maintained                                       │
│ - Timestamps recorded                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

### Read Operations (90% of queries)
```
┌─────────────────────────────────────────┐
│ Optimization Techniques                  │
├─────────────────────────────────────────┤
│ 1. INDEXES                              │
│    - Compound indexes on filter fields  │
│    - Covering indexes where possible    │
│                                         │
│ 2. DENORMALIZATION                      │
│    - Group statistics pre-calculated    │
│    - Avoid joins when possible          │
│                                         │
│ 3. LEAN QUERIES                         │
│    - Return plain objects for read-only │
│    - Skip Mongoose overhead             │
│                                         │
│ 4. SELECTIVE POPULATION                 │
│    - Only populate needed fields        │
│    - Use projection to limit fields     │
│                                         │
│ 5. PAGINATION                           │
│    - Limit result sets                  │
│    - Use skip/limit or cursor-based     │
└─────────────────────────────────────────┘
```

### Write Operations (10% of queries)
```
┌─────────────────────────────────────────┐
│ Optimization Techniques                  │
├─────────────────────────────────────────┤
│ 1. BATCH OPERATIONS                     │
│    - Use insertMany() for bulk          │
│    - Use bulkWrite() for mixed ops      │
│                                         │
│ 2. TRANSACTIONS (when needed)           │
│    - For multi-document updates         │
│    - Ensure data consistency            │
│                                         │
│ 3. ASYNC UPDATES                        │
│    - Update statistics in background    │
│    - Use job queue for heavy tasks      │
│                                         │
│ 4. MINIMIZE MIDDLEWARE                  │
│    - Only essential pre/post hooks      │
│    - Avoid deep nesting                 │
└─────────────────────────────────────────┘
```

---

## Scale Considerations

### Horizontal Scaling
```
Current Design: ✓ Ready for MongoDB sharding
- Shard key on dormGroup for data isolation
- Each group's data stays together
- Minimal cross-shard queries

Load Balancing: ✓ Stateless API design
- No session state in memory
- JWT tokens for authentication
- Redis for caching (future)
```

### Vertical Scaling
```
Database Optimization: ✓ Implemented
- Strategic indexes reduce query time
- Denormalization reduces joins
- Lean queries reduce memory

Application Optimization: Ready for
- Connection pooling
- Query caching
- Result caching with Redis
```

---

This visual guide provides a comprehensive overview of the database schema architecture, relationships, and operational patterns. Use it as a quick reference alongside the detailed DATABASE_SCHEMA.md documentation.
