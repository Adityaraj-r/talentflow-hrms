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

    // Get the admin user
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
        description: 'John Doe was added to Engineering department',
        userId: adminUser._id,
        targetModel: 'User',
        metadata: { department: 'Engineering', role: 'EMPLOYEE' },
      },
      {
        type: 'update',
        title: 'Profile Updated',
        description: 'Jane Smith updated her profile information',
        userId: adminUser._id,
        targetModel: 'User',
      },
      {
        type: 'approval',
        title: 'Leave Approved',
        description: 'Leave request for 3 days was approved',
        userId: adminUser._id,
        targetModel: 'LeaveRequest',
      },
      {
        type: 'create',
        title: 'Department Created',
        description: 'New Marketing department was created',
        userId: adminUser._id,
        targetModel: 'Department',
      },
    ];

    await Activity.deleteMany({}); // Clear existing
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

    await SystemAlert.deleteMany({}); // Clear existing
    await SystemAlert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} system alerts`);

    // Create sample users with correct role enums
    console.log('\n👥 Creating sample users...');
    const sampleUsers = [
      {
        firebaseUid: 'test-user-1',
        email: 'john.doe@hrms.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        phoneNumber: '+1234567890',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(),
      },
      {
        firebaseUid: 'test-user-2',
        email: 'jane.smith@hrms.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'HR_MANAGER',
        phoneNumber: '+1234567891',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        firebaseUid: 'test-user-3',
        email: 'bob.wilson@hrms.com',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'EMPLOYEE',
        phoneNumber: '+1234567892',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        firebaseUid: 'test-user-4',
        email: 'alice.brown@hrms.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Brown',
        role: 'DEPARTMENT_MANAGER',
        phoneNumber: '+1234567893',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(),
      },
      {
        firebaseUid: 'test-user-5',
        email: 'charlie.davis@hrms.com',
        password: 'password123',
        firstName: 'Charlie',
        lastName: 'Davis',
        role: 'EMPLOYEE',
        phoneNumber: '+1234567894',
        isActive: false,
        isEmailVerified: false,
        lastLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        firebaseUid: 'test-user-6',
        email: 'david.kim@hrms.com',
        password: 'password123',
        firstName: 'David',
        lastName: 'Kim',
        role: 'PROJECT_MANAGER',
        phoneNumber: '+1234567895',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        try {
          await User.create(userData);
          console.log(`   ✓ Created user: ${userData.email} (${userData.role})`);
        } catch (err: any) {
          console.log(`   ✗ Failed to create ${userData.email}:`, err.message);
        }
      } else {
        console.log(`   - User already exists: ${userData.email}`);
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
