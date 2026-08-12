import express from 'express'; //
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

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
import goalRoutes from './routes/goalRoutes'
import pipRoutes from './routes/pipRoutes'
import transferRoutes from "./routes/transferRoutes";
import promotionRoutes from "./routes/promotionRoutes";
import auditRoutes from './routes/audit.routes';
import googleRoutes from './routes/google.routes';
import candidateRoutes from "./routes/candidate.routes";
import departmentSyncRoutes from "./routes/departmentSync.routes";
import jobRoutes from "./routes/job.routes";
import { seedRoles } from './utils/roleSeeder';
import { seedFinanceManagerUser } from './utils/seedFinanceManagerUser';
import { seedPayrollSampleData } from './utils/seedPayrollSample';
import reportsRoutes from "./routes/reports.routes";
import applicationRoutes from "./routes/application.routes";
import documentRoutes from './routes/document.routes';
import documentRequestRoutes from './routes/documentRequest.routes';
import salaryRoutes from './routes/salary.routes';
import payrollRoutes from './routes/payroll.routes';
import recruitmentSuggestionRoutes from './routes/recruitmentSuggestion.routes';
import recruitmentAnalyticsRoutes from './routes/recruitmentAnalytics.routes';
import executiveRoutes from "./routes/executive.routes";
import offboardingRoutes from "./routes/offboarding.routes";
import ceoRoutes from './routes/ceo.routes';
import appraisalCycleRoutes from './routes/appraisalCycle.routes';
import bonusRoutes from './routes/bonus.routes';
import notificationRoutes from './routes/notification.routes';
import offerRoutes from './routes/offer.routes';
import disciplinaryRoutes from './routes/disciplinary.routes';
import referralRoutes from './routes/referral.routes';
import meetingRoutes from './routes/meeting.routes';
import User from './models/User.model';
import { initCronJobs } from './scripts/cronJobs';
import dns from 'dns'
import payrollPolicyRoutes from './routes/payrollPolicy.routes';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || '';

initCronJobs();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color =
      res.statusCode >= 500 ? '\x1b[31m' :
      res.statusCode >= 400 ? '\x1b[33m' :
      res.statusCode >= 200 ? '\x1b[32m' :
      '\x1b[0m';
    console.log(
      `${color}[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)\x1b[0m`
    );
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const localUploads = path.join(__dirname, 'uploads');
const rootUploads = path.join(__dirname, '../uploads');

if (fs.existsSync(rootUploads)) {
  app.use('/uploads', express.static(rootUploads));
} else {
  app.use('/uploads', express.static(localUploads));
}

// Fallback to serve uploaded files requested directly without /uploads/ prefix
app.get('/:filename', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const rawFilename = req.params.filename;
  const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;
  if (filename && typeof filename === 'string' && filename.includes('.') && !filename.endsWith('.js') && !filename.endsWith('.html') && !filename.endsWith('.json') && !filename.endsWith('.ts')) {
    const localFile = path.join(localUploads, filename);
    const rootFile = path.join(rootUploads, filename);
    if (fs.existsSync(localFile)) {
      return res.sendFile(localFile);
    }
    if (fs.existsSync(rootFile)) {
      return res.sendFile(rootFile);
    }
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

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
      performance: '/api/performance',
      meetings: '/api/meetings'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/meetings', meetingRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/google', googleRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/departments-sync', departmentSyncRoutes);
app.use('/api/candidates', candidateRoutes);

app.use('/api/requisitions', requisitionRoutes);
app.use('/api/job-openings', jobRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/recruitment-suggestions', recruitmentSuggestionRoutes);
app.use('/api/recruitment/analytics', recruitmentAnalyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/offboarding', offboardingRoutes);

app.use('/api/performance', performanceRoutes);
app.use('/api/performance/goals', goalRoutes)
app.use('/api/performance/pips', pipRoutes)
app.use('/api/holidays', holidayRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/salary-structure', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payroll', payrollPolicyRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/pms/cycles', appraisalCycleRoutes);
app.use('/api/pms/bonus', bonusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/disciplinary', disciplinaryRoutes);
app.use('/api/referrals', referralRoutes);

app.use((req, res) => {
  console.warn(`\x1b[33m[404] Route not found: ${req.method} ${req.path}\x1b[0m`);
  res.status(404).json({ success: false, error: 'Route not found', path: req.path });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('\x1b[31m[SERVER ERROR]\x1b[0m', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const startServer = async () => {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is undefined');

    await mongoose.connect(MONGODB_URI);
    await User.syncIndexes();
    await seedRoles();
    await seedFinanceManagerUser();

    app.listen(PORT, () => {
      console.log(`\x1b[36m🚀 Server listening on port ${PORT}\x1b[0m`);
      console.log(`\x1b[36m📡 Morgan request logger active\x1b[0m`);
      setImmediate(() => {
        seedPayrollSampleData().catch((e: Error) =>
          console.warn('[seedPayrollSample]', e.message)
        );
      });
    });
  } catch (error: any) {
    console.error('\x1b[31mFailed to start server:\x1b[0m', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
