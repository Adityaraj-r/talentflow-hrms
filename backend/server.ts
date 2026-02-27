import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/adminRoutes';
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
import performanceRoutes from './routes/performanceRoutes';
import transferRoutes from "./routes/transferRoutes";
import auditRoutes from './routes/audit.routes';
import googleRoutes from './routes/google.routes';
import candidateRoutes from "./routes/candidate.routes";
import departmentSyncRoutes from "./routes/departmentSync.routes";

import { seedRoles } from './utils/roleSeeder';
import reportsRoutes from "./routes/reports.routes";

// import { syncUsersToEmployees } from "./controllers/user.controller";
import router from './routes/user.routes';
import documentRoutes from './routes/document.routes';


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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const localUploads = path.join(__dirname, 'uploads');
const rootUploads = path.join(__dirname, '../uploads');

if (fs.existsSync(rootUploads)) {
  app.use('/uploads', express.static(rootUploads));
} else {
  app.use('/uploads', express.static(localUploads));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    version: '1.1.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      audit: '/api/audit',
      google: '/api/google',
      employees: '/api/employees',
      attendance: '/api/attendance',
      leaves: '/api/leaves',
      performance: '/api/performance'
    }
  });
});

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/employees", employeeRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/google', googleRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/departments-sync', departmentSyncRoutes);
app.use("/api/candidates", candidateRoutes);

app.use("/api/requisitions", requisitionRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/reports", reportsRoutes);

app.use('/api/performance', performanceRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/documents", documentRoutes);

// router.get("/sync-users", syncUsersToEmployees);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});

// Error handler
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
);

const startServer = async () => {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is undefined');

    await mongoose.connect(MONGODB_URI);
    await seedRoles();

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
