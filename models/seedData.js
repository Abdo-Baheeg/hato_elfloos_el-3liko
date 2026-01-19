const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./User');
const DormGroup = require('./DormGroup');
const Debt = require('./Debt');
const Transaction = require('./Transaction');

/**
 * Seed Database with Test Data
 * 
 * This script creates a complete test scenario with:
 * - 5 users in a dorm group
 * - Various debts between users
 * - Sample transactions
 * 
 * Usage:
 * node models/seedData.js
 */

// MongoDB connection string - update with your database URL
const MONGODB_URI = "mongodb://mongo:ysilvkWSrNOSrfryZUSYqigzkDWCKgQB@maglev.proxy.rlwy.net:51382";

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await DormGroup.deleteMany({});
    await Debt.deleteMany({});
    await Transaction.deleteMany({});
    console.log('✓ Cleared existing data');

    // ========================================
    // Create Users
    // ========================================
    console.log('\n📝 Creating users...');

    const users = await User.create([
      {
        email: 'ahmed.hassan@email.com',
        password: 'password123',
        username: 'ahmed_hassan',
        fullName: 'Ahmed Hassan',
        phoneNumber: '+201234567890',
        role: 'member',
        isEmailVerified: true,
      },
      {
        email: 'mohamed.ali@email.com',
        password: 'password123',
        username: 'mohamed_ali',
        fullName: 'Mohamed Ali',
        phoneNumber: '+201234567891',
        role: 'member',
        isEmailVerified: true,
      },
      {
        email: 'omar.khaled@email.com',
        password: 'password123',
        username: 'omar_khaled',
        fullName: 'Omar Khaled',
        phoneNumber: '+201234567892',
        role: 'member',
        isEmailVerified: true,
      },
      {
        email: 'youssef.Ibrahim@email.com',
        password: 'password123',
        username: 'youssef_ibrahim',
        fullName: 'Youssef Ibrahim',
        phoneNumber: '+201234567893',
        role: 'member',
        isEmailVerified: true,
      },
      {
        email: 'mahmoud.said@email.com',
        password: 'password123',
        username: 'mahmoud_said',
        fullName: 'Mahmoud Said',
        phoneNumber: '+201234567894',
        role: 'admin',
        isEmailVerified: true,
      },
    ]);

    const [ahmed, mohamed, omar, youssef, mahmoud] = users;
    console.log(`✓ Created ${users.length} users`);

    // ========================================
    // Create Dorm Group
    // ========================================
    console.log('\n🏠 Creating dorm group...');

    const dormGroup = await DormGroup.create({
      name: 'Building 5 - Room 304',
      description: 'Computer Science students sharing apartment in university housing',
      createdBy: mahmoud._id,
      members: [
        { user: ahmed._id, role: 'member', joinedAt: new Date('2024-09-01') },
        { user: mohamed._id, role: 'member', joinedAt: new Date('2024-09-01') },
        { user: omar._id, role: 'member', joinedAt: new Date('2024-09-01') },
        { user: youssef._id, role: 'member', joinedAt: new Date('2024-09-01') },
        { user: mahmoud._id, role: 'admin', joinedAt: new Date('2024-09-01') },
      ],
      settings: {
        currency: 'EGP',
        autoResolveDebts: true,
        requireApprovalForDebts: false,
        allowPartialPayments: true,
        reminderFrequency: 'weekly',
        debtDueDateDefault: 30,
      },
      maxMembers: 10,
    });

    console.log(`✓ Created dorm group: ${dormGroup.name}`);
    console.log(`  Invite Code: ${dormGroup.inviteCode}`);

    // Update users with dormGroup reference
    await User.updateMany(
      { _id: { $in: users.map((u) => u._id) } },
      { dormGroup: dormGroup._id }
    );

    // ========================================
    // Create Debts
    // ========================================
    console.log('\n💸 Creating debts...');

    const debts = await Debt.create([
      // Ahmed owes Mohamed for groceries
      {
        creditor: mohamed._id,
        debtor: ahmed._id,
        dormGroup: dormGroup._id,
        originalAmount: 250,
        remainingAmount: 250,
        currency: 'EGP',
        description: 'Groceries from Carrefour - shared items',
        category: 'groceries',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      // Omar owes Ahmed for electricity bill
      {
        creditor: ahmed._id,
        debtor: omar._id,
        dormGroup: dormGroup._id,
        originalAmount: 180,
        remainingAmount: 180,
        currency: 'EGP',
        description: 'Share of electricity bill for October',
        category: 'utilities',
        status: 'pending',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      // Youssef owes Omar for lunch order
      {
        creditor: omar._id,
        debtor: youssef._id,
        dormGroup: dormGroup._id,
        originalAmount: 85,
        remainingAmount: 85,
        currency: 'EGP',
        description: 'Lunch order from KFC',
        category: 'food',
        status: 'pending',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      // Mahmoud owes Youssef for internet bill
      {
        creditor: youssef._id,
        debtor: mahmoud._id,
        dormGroup: dormGroup._id,
        originalAmount: 200,
        remainingAmount: 200,
        currency: 'EGP',
        description: 'Internet bill for November',
        category: 'utilities',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
      // Ahmed owes Mahmoud for cleaning supplies
      {
        creditor: mahmoud._id,
        debtor: ahmed._id,
        dormGroup: dormGroup._id,
        originalAmount: 120,
        remainingAmount: 120,
        currency: 'EGP',
        description: 'Cleaning supplies and household items',
        category: 'supplies',
        status: 'pending',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
      // Mohamed owes Omar for Uber ride
      {
        creditor: omar._id,
        debtor: mohamed._id,
        dormGroup: dormGroup._id,
        originalAmount: 60,
        remainingAmount: 30, // Partially paid
        currency: 'EGP',
        description: 'Shared Uber to university',
        category: 'transportation',
        status: 'partial',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days overdue
      },
      // Paid debt - Youssef paid Ahmed for pizza
      {
        creditor: ahmed._id,
        debtor: youssef._id,
        dormGroup: dormGroup._id,
        originalAmount: 150,
        remainingAmount: 0,
        currency: 'EGP',
        description: 'Pizza party last weekend',
        category: 'food',
        status: 'paid',
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Paid 5 days ago
      },
      // Overdue debt - Mahmoud owes Mohamed for rent
      {
        creditor: mohamed._id,
        debtor: mahmoud._id,
        dormGroup: dormGroup._id,
        originalAmount: 1500,
        remainingAmount: 1500,
        currency: 'EGP',
        description: 'October rent share',
        category: 'rent',
        status: 'pending',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
        notes: [
          {
            user: mohamed._id,
            content: 'Payment was due last week, please settle soon',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ]);

    console.log(`✓ Created ${debts.length} debts`);

    // ========================================
    // Create Transactions
    // ========================================
    console.log('\n💳 Creating transactions...');

    const transactions = await Transaction.create([
      // Youssef paid Ahmed for pizza (debt #6 - paid)
      {
        payer: youssef._id,
        payee: ahmed._id,
        dormGroup: dormGroup._id,
        amount: 150,
        currency: 'EGP',
        type: 'payment',
        paymentMethod: 'mobile_payment',
        paymentDetails: {
          transactionId: 'VODAFONE-CASH-123456',
          notes: 'Paid via Vodafone Cash',
        },
        status: 'confirmed',
        confirmedBy: ahmed._id,
        confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        debts: [
          {
            debt: debts[6]._id,
            amountApplied: 150,
          },
        ],
        description: 'Payment for pizza party',
      },
      // Mohamed partially paid Omar for Uber (debt #5 - partial)
      {
        payer: mohamed._id,
        payee: omar._id,
        dormGroup: dormGroup._id,
        amount: 30,
        currency: 'EGP',
        type: 'payment',
        paymentMethod: 'cash',
        status: 'confirmed',
        confirmedBy: omar._id,
        confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        debts: [
          {
            debt: debts[5]._id,
            amountApplied: 30,
          },
        ],
        description: 'Partial payment for Uber ride',
      },
      // Pending transaction - Ahmed sending payment to Mohamed
      {
        payer: ahmed._id,
        payee: mohamed._id,
        dormGroup: dormGroup._id,
        amount: 250,
        currency: 'EGP',
        type: 'payment',
        paymentMethod: 'bank_transfer',
        paymentDetails: {
          transactionId: 'pending',
          notes: 'Bank transfer initiated',
        },
        status: 'pending',
        debts: [
          {
            debt: debts[0]._id,
            amountApplied: 250,
          },
        ],
        description: 'Payment for groceries',
      },
    ]);

    // Update debt transactions references
    debts[6].transactions.push(transactions[0]._id);
    await debts[6].save();

    debts[5].transactions.push(transactions[1]._id);
    await debts[5].save();

    debts[0].transactions.push(transactions[2]._id);
    await debts[0].save();

    console.log(`✓ Created ${transactions.length} transactions`);

    // ========================================
    // Update Group Statistics
    // ========================================
    await dormGroup.updateStatistics();
    console.log('✓ Updated group statistics');

    // ========================================
    // Display Summary
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 SEED DATA SUMMARY');
    console.log('='.repeat(50));
    console.log(`\n👥 Users Created: ${users.length}`);
    users.forEach((user) => {
      console.log(`   - ${user.fullName} (@${user.username})`);
    });

    console.log(`\n🏠 Dorm Group: ${dormGroup.name}`);
    console.log(`   Invite Code: ${dormGroup.inviteCode}`);
    console.log(`   Members: ${dormGroup.activeMembersCount}`);
    console.log(`   Currency: ${dormGroup.settings.currency}`);

    console.log(`\n💸 Debts: ${debts.length} total`);
    const debtsByStatus = debts.reduce((acc, debt) => {
      acc[debt.status] = (acc[debt.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(debtsByStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    console.log(`   Total Outstanding: ${totalDebtAmount} ${dormGroup.settings.currency}`);

    console.log(`\n💳 Transactions: ${transactions.length} total`);
    const transactionsByStatus = transactions.reduce((acc, txn) => {
      acc[txn.status] = (acc[txn.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(transactionsByStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    const totalTransactionAmount = transactions
      .filter((t) => t.status === 'confirmed')
      .reduce((sum, txn) => sum + txn.amount, 0);
    console.log(`   Total Confirmed: ${totalTransactionAmount} ${dormGroup.settings.currency}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeded successfully!');
    console.log('='.repeat(50));

    console.log('\n📝 Test Credentials:');
    console.log('   Email: ahmed.hassan@email.com');
    console.log('   Password: password123');
    console.log('   (All users have the same password)');

    console.log('\n🔗 Example Queries to Test:');
    console.log('   - Find all debts for Ahmed: Debt.find({ debtor: ahmed._id })');
    console.log('   - Find overdue debts: Debt.findOverdue()');
    console.log('   - Get group members: DormGroup.findByUser(ahmed._id)');
    console.log('   - Calculate net debt: Debt.calculateDebtBetweenUsers(ahmed._id, mohamed._id)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
