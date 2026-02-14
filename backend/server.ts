import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/adminRoutes';  // ← ADD THIS LINE
import attendanceRoutes from "./routes/attendance.routes";
import taskRoutes from "./routes/task.routes";
import leaveRoutes from "./routes/leave.routes";
import shiftRoutes from "./routes/shift.routes";
import holidayRoutes from "./routes/holiday.routes";
import settingsRoutes from './routes/settings.routes';
import onboardingRoutes from './routes/onboardingRoutes';
import employeeRoutes from "./routes/employee.routes";
import requisitionRoutes from "./routes/requisition.routes";
import roleRoutes from './routes/role.routes';
import departmentRoutes from './routes/department.routes';
import { seedRoles } from './utils/roleSeeder';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || '';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HRMS Backend is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'HRMS API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      settings: '/api/settings',
      roles: '/api/roles',
      onboarding: '/api/onboarding',
      departments: '/api/departments'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/employees", employeeRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);

app.use("/api/requisitions", requisitionRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/holidays", holidayRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const startServer = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');

    // Connect to MongoDB with proper options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'Unknown');

    await seedRoles();

    app.listen(PORT, () => {
      console.log('\n============================================================');
      console.log('🚀 HRMS BACKEND SERVER STARTED SUCCESSFULLY!');
      console.log('============================================================');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`✅ Health: http://localhost:${PORT}/health`);
      console.log(`📡 API Info: http://localhost:${PORT}/api`);
      console.log(`🗄️  Database: Connected to MongoDB Atlas`);
      console.log('============================================================\n');
    });

  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed due to app termination');
  process.exit(0);
});

startServer();

export default app;