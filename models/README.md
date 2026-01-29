# Models Directory

This directory contains all Mongoose schemas for the dorm debt tracking application.

## 📁 File Structure

```
models/
├── index.js          # Central export point for all models
├── User.js           # User authentication and profile schema
├── DormGroup.js      # Dorm group/living space schema
├── Debt.js           # Individual debt records schema
├── Transaction.js    # Payment/settlement transaction schema
├── seedData.js       # Test data generator
└── README.md         # This file
```

## 🚀 Quick Start

### Import Models

```javascript
// Import all models
const { User, DormGroup, Debt, Transaction } = require('./models');

// Or import individually
const User = require('./models/User');
```

### Dependencies Required

```bash
npm install mongoose bcryptjs
```

### Initialize Database Connection

```javascript
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/hato_elfloos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### Seed Test Data

```bash
node models/seedData.js
```

## 📚 Models Overview

### User
- Authentication (email/password with bcrypt)
- Profile information
- Dorm group membership
- Notification preferences
- Account security (login attempts, account locking)

**Key Features:**
- Password auto-hashing
- Email/username uniqueness
- Login attempt tracking
- Soft delete support

### DormGroup
- Group management
- Member roles (admin/member)
- Invite system with codes
- Group settings and preferences
- Statistics tracking

**Key Features:**
- Auto-generated invite codes
- Member management methods
- Group statistics calculation
- Configurable settings

### Debt
- Debt tracking between users
- Status lifecycle management
- Payment history
- Attachments and notes
- Dispute handling

**Key Features:**
- Automatic status updates
- Overdue detection
- Net debt calculation between users
- Soft delete support

### Transaction
- Payment recording
- Multiple payment methods
- Confirmation workflow
- Debt settlement tracking
- Reversal support

**Key Features:**
- Multi-debt settlement
- Status history tracking
- Payment verification
- Transaction reversal

## 🔍 Common Usage Examples

### Create a User

```javascript
const user = await User.create({
  email: 'user@example.com',
  password: 'securePassword123',
  username: 'johndoe',
  fullName: 'John Doe',
  phoneNumber: '+1234567890'
});
```

### Create a Dorm Group

```javascript
const group = await DormGroup.create({
  name: 'Apartment 5B',
  description: 'CS students',
  createdBy: userId,
  members: [
    { user: userId, role: 'admin' }
  ]
});

// Add more members
await group.addMember(newUserId, 'member');
```

### Create a Debt

```javascript
const debt = await Debt.create({
  creditor: creditorId,
  debtor: debtorId,
  dormGroup: groupId,
  originalAmount: 50.00,
  description: 'Shared groceries',
  category: 'groceries',
  currency: 'USD'
});
```

### Record a Payment

```javascript
const transaction = await Transaction.create({
  payer: payerId,
  payee: payeeId,
  dormGroup: groupId,
  amount: 50.00,
  paymentMethod: 'cash',
  debts: [{ debt: debtId, amountApplied: 50.00 }]
});

// Confirm the transaction
await transaction.confirm(payeeId);
```

### Find Overdue Debts

```javascript
const overdueDebts = await Debt.findOverdue();
```

### Calculate Net Debt

```javascript
const result = await Debt.calculateDebtBetweenUsers(user1Id, user2Id);
console.log(`Net debt: ${result.netDebt}`);
```

## 🔐 Security Considerations

1. **Password Security**
   - Passwords are automatically hashed with bcrypt (12 rounds)
   - Never returned in queries by default (`select: false`)
   - Strong validation rules

2. **Account Security**
   - Login attempt tracking
   - Automatic account locking after 5 failed attempts
   - 2-hour lockout period

3. **Data Privacy**
   - Soft deletes maintain data integrity
   - Sensitive fields excluded from default queries
   - Email verification support

## 📊 Indexing Strategy

Each model includes strategic indexes for performance:

- **User**: email, username, dormGroup combinations
- **DormGroup**: inviteCode, members.user
- **Debt**: creditor+status, debtor+status, dormGroup+status
- **Transaction**: payer+status, payee+status, dormGroup+status

## 🧪 Testing

Run the seed script to populate your database with test data:

```bash
node models/seedData.js
```

This creates:
- 5 test users
- 1 dorm group
- 8 sample debts (various statuses)
- 3 sample transactions

Test credentials:
- Email: `ahmed.hassan@email.com`
- Password: `password123`

## 📖 Full Documentation

See [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) for comprehensive documentation including:
- Detailed ER diagrams
- Complete field descriptions
- Relationship explanations
- Design rationale
- Future enhancement plans
- Best practices

## 🛠️ Development Tips

1. **Use model methods** instead of raw updates:
   ```javascript
   // ✅ Good
   await debt.makePayment(50);
   
   // ❌ Bad
   debt.remainingAmount -= 50;
   await debt.save();
   ```

2. **Populate selectively**:
   ```javascript
   // ✅ Good
   .populate('creditor', 'username fullName')
   
   // ❌ Bad
   .populate('creditor')
   ```

3. **Use lean() for read-only**:
   ```javascript
   const debts = await Debt.find().lean();
   ```

4. **Handle validation errors**:
   ```javascript
   try {
     await user.save();
   } catch (error) {
     if (error.name === 'ValidationError') {
       // Handle validation
     }
   }
   ```

## 🤝 Contributing

When adding new fields or methods:
1. Update the schema file
2. Update DATABASE_SCHEMA.md documentation
3. Add appropriate indexes
4. Include validation rules
5. Update seedData.js if needed

## 📞 Support

For questions or issues with the database schema, refer to:
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Complete schema documentation
- Inline comments in model files
- Mongoose documentation: https://mongoosejs.com/
