# 💰 Hato Elfloos - Dorm Debt Tracking System

A production-ready mobile application backend for tracking and resolving debts between roommates and dorm members.

## 🎯 Features

- **User Management**: Secure registration, authentication, and profile management
- **Dorm Groups**: Create and manage shared living spaces with multiple members
- **Debt Tracking**: Create, track, and manage debts between group members
- **Payment Recording**: Record and verify payments with multiple payment methods
- **Smart Settlement**: Support for multi-debt settlements and partial payments
- **Status Management**: Comprehensive debt lifecycle tracking (pending, partial, paid, disputed)
- **Dispute Resolution**: Built-in dispute handling system
- **History Tracking**: Complete audit trail of all debt and payment activities
- **Soft Deletes**: Maintain data integrity with recoverable deletions

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcryptjs for password hashing
- **Architecture**: MVC (Model-View-Controller)

### Project Structure
```
hato_elfloos_el-3liko/
├── models/              # Mongoose schemas
│   ├── User.js         # User authentication & profile
│   ├── DormGroup.js    # Group management
│   ├── Debt.js         # Debt tracking
│   ├── Transaction.js  # Payment records
│   ├── index.js        # Model exports
│   ├── seedData.js     # Test data generator
│   └── README.md       # Models documentation
├── config/             # Configuration files
│   └── database.js     # MongoDB connection
├── routes/             # Express routes
├── controllers/        # Business logic (to be implemented)
├── middleware/         # Custom middleware (to be implemented)
├── public/             # Static files
├── views/              # View templates
├── bin/               # Server startup
│   └── www
├── .env.example       # Environment variables template
├── DATABASE_SCHEMA.md # Complete schema documentation
└── package.json       # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd hato_elfloos_el-3liko
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```
   This creates test users, a dorm group, and sample debts/transactions.

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## 📊 Database Schema

### Core Models

#### User
- Authentication (email/password)
- Profile information
- Dorm group membership
- Notification preferences
- Security features (login attempts, account locking)

#### DormGroup
- Group management with invite codes
- Member roles (admin/member)
- Configurable settings
- Group statistics

#### Debt
- Track debts between users
- Support for categories and attachments
- Status lifecycle (pending → partial → paid)
- Dispute handling
- Notes and communication

#### Transaction
- Payment recording
- Multiple payment methods
- Confirmation workflow
- Multi-debt settlement
- Reversal support

For detailed schema documentation, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

## 🔍 Usage Examples

### Creating a User
```javascript
const { User } = require('./models');

const user = await User.create({
  email: 'user@example.com',
  password: 'securePassword123',
  username: 'johndoe',
  fullName: 'John Doe',
  phoneNumber: '+1234567890'
});
```

### Creating a Dorm Group
```javascript
const { DormGroup } = require('./models');

const group = await DormGroup.create({
  name: 'Apartment 5B',
  description: 'CS students',
  createdBy: userId,
  members: [{ user: userId, role: 'admin' }]
});
```

### Recording a Debt
```javascript
const { Debt } = require('./models');

const debt = await Debt.create({
  creditor: creditorId,
  debtor: debtorId,
  dormGroup: groupId,
  originalAmount: 50.00,
  description: 'Shared groceries',
  category: 'groceries'
});
```

### Making a Payment
```javascript
const { Transaction } = require('./models');

const transaction = await Transaction.create({
  payer: payerId,
  payee: payeeId,
  dormGroup: groupId,
  amount: 50.00,
  paymentMethod: 'cash',
  debts: [{ debt: debtId, amountApplied: 50.00 }]
});

await transaction.confirm(payeeId);
```

## 🧪 Testing

### Test Data
Run the seed script to populate your database:
```bash
npm run seed
```

**Test Credentials:**
- Email: `ahmed.hassan@email.com`
- Password: `password123`

This creates:
- 5 test users
- 1 dorm group
- 8 sample debts (various statuses)
- 3 sample transactions

### Manual Testing
Use MongoDB Compass or mongo shell to inspect the data:
```bash
mongo
use hato_elfloos
db.users.find().pretty()
db.debts.find().pretty()
```

## 📝 API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Deactivate user

### Dorm Groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `POST /api/groups/:id/join` - Join group with invite code
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Debts
- `POST /api/debts` - Create debt
- `GET /api/debts` - List debts (with filters)
- `GET /api/debts/:id` - Get debt details
- `PUT /api/debts/:id` - Update debt
- `DELETE /api/debts/:id` - Delete debt
- `POST /api/debts/:id/notes` - Add note to debt

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/confirm` - Confirm transaction
- `PUT /api/transactions/:id/reject` - Reject transaction
- `POST /api/transactions/:id/reverse` - Reverse transaction

## 🔐 Security Features

### Authentication
- Password hashing with bcrypt (12 salt rounds)
- Passwords never returned in API responses
- Email verification support
- Password reset functionality

### Account Security
- Login attempt tracking
- Automatic account locking after 5 failed attempts
- 2-hour lockout period
- Session management

### Data Protection
- Soft deletes maintain audit trail
- Input validation on all fields
- MongoDB injection prevention
- XSS protection (to be implemented)

## 🎨 Design Decisions

### Why Soft Deletes?
- Maintain complete audit trail
- Support undo operations
- Preserve referential integrity
- Meet compliance requirements

### Why Embedded vs Referenced?
- **Embedded**: Small, bounded data accessed together (group members, debt notes)
- **Referenced**: Large objects needing independent queries (users, debts)

### Why Denormalization?
- Group statistics for fast dashboard queries
- Trade consistency for read performance
- Update async with job queue

For detailed design rationale, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

## 🚀 Future Enhancements

### Phase 1 - Core Features
- [ ] REST API implementation
- [ ] JWT authentication
- [ ] Authorization middleware
- [ ] Error handling middleware
- [ ] Request validation
- [ ] API documentation (Swagger)

### Phase 2 - Advanced Features
- [ ] Debt resolution algorithm (circular debt simplification)
- [ ] Real-time notifications (Socket.io)
- [ ] Email notifications
- [ ] File upload (receipts, attachments)
- [ ] Payment gateway integration (Stripe)
- [ ] Mobile push notifications

### Phase 3 - Analytics & Reporting
- [ ] Monthly reports
- [ ] Spending analytics by category
- [ ] Group activity dashboard
- [ ] Export to CSV/PDF
- [ ] Data visualization charts

### Phase 4 - Enterprise Features
- [ ] Multi-currency support with exchange rates
- [ ] Recurring payments
- [ ] Scheduled transactions
- [ ] Advanced dispute resolution
- [ ] Mediator roles
- [ ] Comprehensive audit logs

## 🛠️ Development

### Code Style
- Use ES6+ features
- Follow Airbnb style guide
- Use async/await over callbacks
- Add JSDoc comments for functions

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

### Database Migrations
When adding new fields:
1. Update model schema
2. Update DATABASE_SCHEMA.md
3. Add migration script if needed
4. Update seedData.js

## 📚 Documentation

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete database schema documentation
- [models/README.md](models/README.md) - Models usage guide
- Inline code comments for complex logic
- JSDoc comments for public methods

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Team

- Backend Architecture & Database Design

## 📞 Support

For questions or issues:
- Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for schema details
- Review model files for implementation examples
- Check inline comments for specific logic

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- Mongoose team for the powerful ODM
- MongoDB for the flexible database

---

**Built with ❤️ for hassle-free debt management**
