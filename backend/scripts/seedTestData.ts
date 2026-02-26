import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Activity from '../models/Activity';
import SystemAlert from '../models/SystemAlert';

dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed test data...');

    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    const adminUser = await User.findOne({ email: 'admin@hrms.com' });

    if (!adminUser) {
      console.log('❌ Admin user not found. Please login first.');
      process.exit(1);
    }

    console.log('📊 Found admin user:', adminUser.email);

    // Create sample activities
    console.log('\n📝 Creating sample activities...');
    const activities = [
      {
        type: 'login',
        title: 'Admin Login',
        description: 'Admin user logged into the system',
        userId: adminUser._id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
      {
        type: 'create',
        title: 'New Employee Added',
        description: 'Arjun Sharma was added to Engineering department',
        userId: adminUser._id,
        targetModel: 'User',
        metadata: { department: 'Engineering', role: 'EMPLOYEE' },
      },
      {
        type: 'update',
        title: 'Profile Updated',
        description: 'Priya Mehta updated her profile information',
        userId: adminUser._id,
        targetModel: 'User',
      },
      {
        type: 'approval',
        title: 'Leave Approved',
        description: 'Leave request for 3 days approved for Diwali',
        userId: adminUser._id,
        targetModel: 'LeaveRequest',
      },
      {
        type: 'create',
        title: 'Department Created',
        description: 'New Operations department was created',
        userId: adminUser._id,
        targetModel: 'Department',
      },
    ];

    await Activity.deleteMany({});
    await Activity.insertMany(activities);
    console.log(`✅ Created ${activities.length} activities`);

    // Create sample system alerts
    console.log('\n🚨 Creating sample system alerts...');
    const alerts = [
      {
        title: 'High Memory Usage',
        message: 'System memory usage exceeded 85% threshold',
        severity: 'high',
        status: 'active',
        type: 'performance',
      },
      {
        title: 'Failed Login Attempts',
        message: '5 failed login attempts detected from IP 192.168.1.50',
        severity: 'critical',
        status: 'active',
        type: 'security',
      },
      {
        title: 'Database Backup Complete',
        message: 'Scheduled database backup completed successfully',
        severity: 'low',
        status: 'resolved',
        type: 'maintenance',
        resolvedAt: new Date(),
        resolvedBy: adminUser._id,
      },
    ];

    await SystemAlert.deleteMany({});
    await SystemAlert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} system alerts`);

    // Create sample Indian users
    console.log('\n👥 Creating sample users...');
    const sampleUsers = [
      {
        email: 'arjun.sharma@hrms.com',
        password: 'password123',
        firstName: 'Arjun',
        lastName: 'Sharma',
        role: 'EMPLOYEE',
        department: 'Engineering',
        phoneNumber: '9876543210',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(),
      },
      {
        email: 'priya.mehta@hrms.com',
        password: 'password123',
        firstName: 'Priya',
        lastName: 'Mehta',
        role: 'HR_MANAGER',
        department: 'Human Resources',
        phoneNumber: '9845123456',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'rahul.verma@hrms.com',
        password: 'password123',
        firstName: 'Rahul',
        lastName: 'Verma',
        role: 'EMPLOYEE',
        department: 'Finance',
        phoneNumber: '9812345678',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'ananya.iyer@hrms.com',
        password: 'password123',
        firstName: 'Ananya',
        lastName: 'Iyer',
        role: 'DEPARTMENT_MANAGER',
        department: 'Operations',
        phoneNumber: '9823456789',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(),
      },
      {
        email: 'rohit.patel@hrms.com',
        password: 'password123',
        firstName: 'Rohit',
        lastName: 'Patel',
        role: 'EMPLOYEE',
        department: 'Marketing',
        phoneNumber: '9867890123',
        isActive: false,
        isEmailVerified: false,
        lastLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'kavya.nair@hrms.com',
        password: 'password123',
        firstName: 'Kavya',
        lastName: 'Nair',
        role: 'PROJECT_MANAGER',
        department: 'Engineering',
        phoneNumber: '9898765432',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'vikram.singh@hrms.com',
        password: 'password123',
        firstName: 'Vikram',
        lastName: 'Singh',
        role: 'HR_OFFICER',
        department: 'Human Resources',
        phoneNumber: '9756123456',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'deepa.reddy@hrms.com',
        password: 'password123',
        firstName: 'Deepa',
        lastName: 'Reddy',
        role: 'PAYROLL_OFFICER',
        department: 'Finance',
        phoneNumber: '9734567890',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        try {
          await User.create(userData);
          console.log(`   ✓ Created: ${userData.firstName} ${userData.lastName} (${userData.role})`);
        } catch (err: any) {
          console.log(`   ✗ Failed to create ${userData.email}:`, err.message);
        }
      } else {
        console.log(`   - Already exists: ${userData.email}`);
      }
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Activities: ${activities.length}`);
    console.log(`   - System Alerts: ${alerts.length}`);
    console.log(`   - Sample Users: ${sampleUsers.length}`);
    console.log('\n✅ Refresh your admin dashboard to see the data!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
