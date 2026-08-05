import { Response } from 'express'; //
import mongoose from 'mongoose';
import Offer from '../models/Offer.model';
import Employee from '../models/Employee.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { createLog } from './audit.controller';
import User from '../models/User.model';
import { generateOfferLetterPdfBuffer } from '../utils/pdfGenerator';
import { sendOfferEmail } from '../utils/sendEmail';

const CEO_OFFER_THRESHOLD = () => Number(process.env.CEO_OFFER_SALARY_THRESHOLD || 250000);
const PENDING_OFFER_APPROVAL_STATUSES: string[] = [];
const isPendingOfferApproval = (_status?: string) => false;
const canReleaseOffer = (_status?: string) => true;

const normalizeRole = (role?: string) =>
  (role || '').toString().toUpperCase().replace(/\s+/g, '_');

const userName = (req: AuthRequest) =>
  `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'System';

const logOfferAction = async (req: AuthRequest, action: string, details: string, beforeValue?: unknown, afterValue?: unknown) => {
  await createLog(
    req.user?.id || 'system',
    userName(req),
    action,
    'recruitment-offers',
    details,
    req.ip || 'unknown',
    'Success',
    { userRole: req.user?.role, beforeValue, afterValue }
  );
};

const dayMs = 1000 * 60 * 60 * 24;
const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const trend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const compensationFor = (salary: number, body: any = {}) => {
  const fixedSalary = Number(body.fixedSalary ?? salary) || 0;
  const bonus = Number(body.bonus ?? Math.round(salary * 0.1)) || 0;
  const allowances = Number(body.allowances ?? Math.round(salary * 0.12)) || 0;
  const benefitsValue = Number(body.benefitsValue ?? Math.round(salary * 0.06)) || 0;
  const joiningBonus = Number(body.joiningBonus ?? 0) || 0;
  const stockOptions = Number(body.stockOptions ?? 0) || 0;
  return {
    fixedSalary,
    bonus,
    allowances,
    benefitsValue,
    joiningBonus,
    stockOptions,
    totalCtc: fixedSalary + bonus + allowances + benefitsValue + joiningBonus + stockOptions,
  };
};

const parseBenefits = (benefits: unknown) =>
  Array.isArray(benefits)
    ? benefits.map((item) => String(item).trim()).filter(Boolean)
    : typeof benefits === 'string'
    ? benefits.split(',').map((item: string) => item.trim()).filter(Boolean)
    : [];

const approvalStatusForSalary = (_salary: number) => 'Offered';

const buildOfferAnalytics = async () => {
  const now = new Date();
  const start = new Date(now.getTime() - 90 * dayMs);
  const previousStart = new Date(start.getTime() - 90 * dayMs);
  const [offers, previousOffers] = await Promise.all([
    Offer.find({ createdAt: { $gte: start, $lte: now } }).sort({ createdAt: -1 }).lean(),
    Offer.find({ createdAt: { $gte: previousStart, $lt: start } }).lean(),
  ]);

  const allOffers = await Offer.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('employeeId', 'employeeCode name email status department designation')
    .lean();
  const accepted = offers.filter((offer: any) => offer.status === 'Accepted').length;
  const rejected = offers.filter((offer: any) => offer.status === 'Declined').length;
  const pending = offers.filter((offer: any) => isPendingOfferApproval(offer.status) || offer.status === 'Under Review' || offer.status === 'Changes Requested').length;
  const changesRequested = offers.filter((offer: any) => offer.status === 'Changes Requested').length;
  const sent = offers.filter((offer: any) => offer.status === 'Offered' || offer.sentAt).length;
  const expiryAlerts = offers.filter((offer: any) => {
    const expiry = offer.expiryDate ? new Date(offer.expiryDate) : new Date(new Date(offer.createdAt).getTime() + 7 * dayMs);
    const days = (expiry.getTime() - now.getTime()) / dayMs;
    return days >= 0 && days <= 3 && offer.status === 'Offered';
  }).length;
  const avgSalary = offers.length ? Math.round(offers.reduce((sum: number, offer: any) => sum + Number(offer.salary || 0), 0) / offers.length) : 0;
  const previousAccepted = previousOffers.filter((offer: any) => offer.status === 'Accepted').length;
  const pendingBeyondSla = allOffers.filter((offer: any) => {
    if (!isPendingOfferApproval(offer.status) && offer.status !== 'Under Review' && offer.status !== 'Changes Requested') return false;
    const updatedAt = new Date(offer.updatedAt || offer.createdAt).getTime();
    return Number.isFinite(updatedAt) && (now.getTime() - updatedAt) / dayMs > 2;
  }).length;
  const highValueOpen = allOffers.filter((offer: any) => Number(offer.salary || 0) >= CEO_OFFER_THRESHOLD() && ['Offered', 'Pending HR Manager Approval', 'Changes Requested', 'Under Review'].includes(offer.status)).length;

  const overview = [
    { key: 'generated', label: 'Offers Generated', value: offers.length, suffix: '', trend: trend(offers.length, previousOffers.length), comparison: 'vs previous period', status: 'active', sparkline: [4, 6, 8, 7, 10, offers.length] },
    { key: 'pending', label: 'Offers Pending Approval', value: pending, suffix: '', trend: trend(pending, previousOffers.filter((offer: any) => isPendingOfferApproval(offer.status) || offer.status === 'Under Review' || offer.status === 'Changes Requested').length), comparison: 'approval queue', status: pending ? 'warning' : 'healthy', sparkline: [2, 3, 2, 4, 3, pending] },
    { key: 'sent', label: 'Offers Sent', value: sent, suffix: '', trend: trend(sent, previousOffers.filter((offer: any) => offer.status === 'Offered').length), comparison: 'released offers', status: 'active', sparkline: [3, 4, 5, 6, 7, sent] },
    { key: 'accepted', label: 'Offers Accepted', value: accepted, suffix: '', trend: trend(accepted, previousAccepted), comparison: 'candidate wins', status: 'success', sparkline: [1, 2, 3, 3, 4, accepted] },
    { key: 'rejected', label: 'Offers Rejected', value: rejected, suffix: '', trend: -trend(rejected, previousOffers.filter((offer: any) => offer.status === 'Declined').length), comparison: 'loss control', status: rejected ? 'risk' : 'healthy', sparkline: [1, 1, 2, 1, 2, rejected] },
    { key: 'acceptanceRate', label: 'Offer Acceptance Rate', value: percent(accepted, offers.length), suffix: '%', trend: trend(percent(accepted, offers.length), percent(previousAccepted, previousOffers.length)), comparison: 'accepted / generated', status: 'success', sparkline: [62, 66, 68, 71, 74, percent(accepted, offers.length)] },
    { key: 'expiryAlerts', label: 'Offer Expiry Alerts', value: expiryAlerts, suffix: '', trend: -8, comparison: 'next 3 days', status: expiryAlerts ? 'warning' : 'healthy', sparkline: [3, 2, 2, 1, 2, expiryAlerts] },
    { key: 'avgSalary', label: 'Average Salary Offered', value: avgSalary, suffix: '', trend: 6, comparison: 'compensation level', status: 'active', sparkline: [avgSalary * 0.82, avgSalary * 0.9, avgSalary * 0.94, avgSalary] },
  ];

  const monthly = await Offer.aggregate([
    { $match: { createdAt: { $gte: new Date(now.getTime() - 365 * dayMs), $lte: now } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, status: '$status' }, count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
  const trends = monthly.reduce((acc: any[], row: any) => {
    const month = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    let item = acc.find((entry) => entry.month === month);
    if (!item) {
      item = { month, generated: 0, accepted: 0, rejected: 0, negotiation: 0, avgCompensation: 0 };
      acc.push(item);
    }
    item.generated += row.count;
    if (row._id.status === 'Accepted') item.accepted += row.count;
    if (row._id.status === 'Declined') item.rejected += row.count;
    item.avgCompensation = Math.round(row.avgSalary || 0);
    return acc;
  }, []);

  const approvals = allOffers.filter((offer: any) => isPendingOfferApproval(offer.status) || offer.status === 'Changes Requested' || offer.status === 'Under Review' || offer.approvalStage?.includes('Approval'));
  const activity = allOffers.flatMap((offer: any) => {
    const history = Array.isArray(offer.activityHistory) && offer.activityHistory.length ? offer.activityHistory : [
      { type: 'offer-created', message: `Offer created for ${offer.candidateName}`, actor: 'Recruitment', at: offer.createdAt, priority: 'normal' },
      { type: 'offer-status', message: `${offer.candidateName} is currently ${offer.status}`, actor: 'Hiring Operations', at: offer.updatedAt, priority: isPendingOfferApproval(offer.status) ? 'high' : 'normal' },
    ];
    return history.map((item: any) => ({ ...item, offerId: offer.offerId, candidateName: offer.candidateName }));
  }).sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);

  const notifications = [
    ...approvals.slice(0, 5).map((offer: any) => ({ type: 'approval', priority: 'high', title: 'Offer awaiting approval', message: `${offer.candidateName} requires approval action.`, at: offer.updatedAt || offer.createdAt })),
    ...allOffers.filter((offer: any) => offer.status === 'Changes Requested').slice(0, 3).map((offer: any) => ({ type: 'changes', priority: 'high', title: 'Offer changes requested', message: `${offer.candidateName} needs a revised offer package.`, at: offer.updatedAt })),
    ...allOffers.filter((offer: any) => offer.status === 'Accepted').slice(0, 3).map((offer: any) => ({ type: 'accepted', priority: 'success', title: 'Candidate accepted offer', message: `${offer.candidateName} accepted ${offer.offerId}.`, at: offer.updatedAt })),
    ...allOffers.filter((offer: any) => offer.status === 'Offered').slice(0, 4).map((offer: any) => ({ type: 'reminder', priority: 'medium', title: 'Offer follow-up due', message: `${offer.candidateName} offer response should be monitored.`, at: offer.updatedAt })),
  ];

  const insights = [
    { type: 'success', title: 'Offer package competitive', description: `Current acceptance rate is ${percent(accepted, offers.length)}%.`, recommendation: 'Keep approval turnaround under 48 hours for high-demand roles.' },
    { type: pending ? 'warning' : 'success', title: pending ? 'Approval queue needs attention' : 'Approval flow healthy', description: `${pending} offers are waiting for approval or package updates.`, recommendation: pendingBeyondSla ? `${pendingBeyondSla} offers are beyond the 48-hour approval SLA.` : 'Maintain current approval cadence.' },
    { type: changesRequested ? 'warning' : 'risk', title: 'Negotiation risk monitor', description: `${changesRequested} offers currently require package changes.`, recommendation: highValueOpen ? `Review ${highValueOpen} high-value open packages before release.` : 'Review packages below department benchmarks before release.' },
    { type: 'opportunity', title: 'Pre-onboarding readiness', description: 'Accepted offers can flow into employee creation, documents, payroll, and department setup.', recommendation: 'Trigger onboarding tasks immediately after acceptance.' },
  ];

  return {
    overview,
    offers: allOffers,
    approvals,
    trends,
    activity,
    notifications,
    insights,
    analytics: {
      acceptanceRate: percent(accepted, offers.length),
      rejectionRate: percent(rejected, offers.length),
      negotiationRate: percent(allOffers.filter((offer: any) => offer.negotiationRounds?.length).length, allOffers.length),
      joiningConversion: percent(allOffers.filter((offer: any) => offer.preOnboarding?.some((step: any) => step.step === 'Department Assignment' && step.status === 'Completed')).length, accepted),
      averageCompensation: avgSalary,
      approvalTurnaroundTime: 2.8,
      pendingBeyondSla,
      highValueOpen,
      changesRequested,
    },
  };
};

export const syncOfferJoinedStatus = async (targetEmail?: string) => {
  try {
    const filter: any = {};
    if (targetEmail) {
      filter.candidateEmail = { $regex: new RegExp(`^${targetEmail.trim()}$`, 'i') };
    } else {
      filter.status = { $in: ['Accepted', 'Joined'] };
    }

    const offers = await Offer.find(filter);
    for (const offer of offers) {
      if (!offer.candidateEmail) continue;
      const normalizedEmail = offer.candidateEmail.toLowerCase().trim();

      const employee = await Employee.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });

      if (employee) {
        const isEmployeeActive = employee.status === 'Active' || employee.onboardingStatus === 'Completed' || Boolean(employee.employeeCode);
        if (isEmployeeActive) {
          let updated = false;

          if (String(offer.employeeId || '') !== String(employee._id)) {
            offer.employeeId = employee._id as any;
            updated = true;
          }

          if (offer.status !== 'Joined' || offer.approvalStage !== 'Completed') {
            offer.status = 'Joined' as any;
            offer.approvalStage = 'Completed' as any;
            updated = true;
          }

          const existingHistory = (offer.get('activityHistory') as any[]) || [];
          const historyTypes = new Set(existingHistory.map((h: any) => h.type));

          const newEvents: any[] = [];
          if (!historyTypes.has('employee-created')) {
            newEvents.push({
              type: 'employee-created',
              message: `Employee Record Created (${employee.employeeCode || 'Registered'}).`,
              actor: 'Employee Center',
              priority: 'normal',
              at: (employee as any).createdAt || new Date(),
            });
          }
          if (!historyTypes.has('employee-onboarded')) {
            newEvents.push({
              type: 'employee-onboarded',
              message: `Employee Successfully Onboarded into ${employee.department || 'Department'}.`,
              actor: 'Onboarding System',
              priority: 'normal',
              at: new Date(),
            });
          }
          if (!historyTypes.has('candidate-joined')) {
            newEvents.push({
              type: 'candidate-joined',
              message: `Employee Joined Organization as ${employee.designation || offer.position || 'Employee'} (${employee.employeeCode || 'EMP'}). Offer lifecycle complete.`,
              actor: 'HRMS System',
              priority: 'normal',
              at: new Date(),
            });
          }

          if (newEvents.length > 0) {
            offer.set('activityHistory', [...existingHistory, ...newEvents]);
            updated = true;
          }

          if (updated) {
            await offer.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing offer joined status:', err);
  }
};

export const getOffers = async (req: AuthRequest, res: Response) => {
  try {
    await syncOfferJoinedStatus();
    const offers = await Offer.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName')
      .populate('employeeId', 'employeeCode name email status department designation')
      .populate('jobId')
      .populate({ path: 'candidateId', populate: { path: 'jobId' } });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getOfferById = async (req: AuthRequest, res: Response) => {
  try {
    await syncOfferJoinedStatus();
    const offer = await Offer.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('employeeId', 'employeeCode name email status department designation');
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, candidateEmail, candidateName, salary, joiningDate, position, department, noticeBuyout, benefits, probationDetails, reportingManager, templateId } = req.body;
    if (
       !candidateName ||
      !position ||
      !department ||
      !salary ||
      !joiningDate
    ){
      return res.status(400).json({
        success: false,
        error: "All offer fields are required."
      });
     }
    const numSalary = Number(salary);
    if (!Number.isFinite(numSalary) || numSalary <= 0) {
      return res.status(400).json({ success: false, error: 'Salary must be a valid positive amount.' });
    }

    const queryApp = candidateId
      ? { _id: candidateId }
      : (candidateEmail ? { email: candidateEmail } : null);
    if (queryApp) {
      const application = await mongoose.model("Application").findOne(queryApp);
      if (application && !application.offerEnabled) {
        return res.status(403).json({
          success: false,
          error: "Offer generation is disabled. Candidate must be Approved first.",
        });
      }
    }

    const offerId = `OFF-${Date.now()}`;
    const status = approvalStatusForSalary(numSalary);
    const needsApproval = isPendingOfferApproval(status);
    const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : new Date(Date.now() + 7 * dayMs);
    const compensation = compensationFor(numSalary, req.body);
    const query = candidateId 
      ? { candidateId } 
      : (candidateEmail ? { candidateEmail } : { candidateName });
    const existingOffer = await Offer.findOne(query);

if (existingOffer) {
  existingOffer.candidateId = candidateId || existingOffer.candidateId;
  existingOffer.candidateEmail = candidateEmail || existingOffer.candidateEmail || '';
  existingOffer.position = position;
  existingOffer.department = department;
  existingOffer.salary = numSalary;
  existingOffer.joiningDate = joiningDate;
  existingOffer.reportingManager = reportingManager || existingOffer.reportingManager || '';
  existingOffer.expiryDate = expiryDate;
  existingOffer.noticeBuyout = Number(noticeBuyout || 0);
  existingOffer.bonus = Number(req.body.bonus || compensation.bonus);
  existingOffer.benefits = parseBenefits(benefits);
  existingOffer.probationDetails = probationDetails;
  existingOffer.templateId = templateId;
  existingOffer.compensation = compensation;
  existingOffer.status = status as any;
  existingOffer.approvalStage = 'Approved' as any;
  existingOffer.set('approvalHistory', [...((existingOffer.get('approvalHistory') as any[]) || []), {
    role: 'Recruiter',
    approverName: userName(req),
    approverId: req.user?.id,
    action: 'Submitted',
    comments: 'Offer package revised and resubmitted',
    at: new Date(),
  }]);
  existingOffer.set('activityHistory', [...((existingOffer.get('activityHistory') as any[]) || []), {
    type: 'offer-resubmitted',
    message: `Offer package revised for ${candidateName}`,
    actor: userName(req),
    priority: needsApproval ? 'high' : 'normal',
    at: new Date(),
  }]);

  await existingOffer.save();
  await logOfferAction(req, 'Update Offer', `Updated offer ${existingOffer.offerId} for ${candidateName}`, null, existingOffer.toObject());

  return res.status(200).json({
    success: true,
    data: existingOffer,
  });
}
    const offer = await Offer.create({
      offerId,
      candidateId: candidateId || undefined,
      candidateEmail: candidateEmail || '',
      candidateName,
      position,
      department,
      salary: numSalary,
      joiningDate,
      expiryDate,
      noticeBuyout: Number(noticeBuyout || 0),
      bonus: Number(req.body.bonus || compensation.bonus),
      benefits: parseBenefits(benefits),
      probationDetails,
      reportingManager: reportingManager || '',
      templateId,
      status: status as any,
      approvalStage: 'Approved' as any,
      compensation,
      approvalHistory: [{ role: 'Recruiter', approverName: userName(req), approverId: req.user?.id, action: 'Submitted', comments: 'Offer package submitted', at: new Date() }],
      activityHistory: [{ type: 'offer-created', message: `Recruiter submitted offer for ${candidateName}`, actor: userName(req), priority: needsApproval ? 'high' : 'normal', at: new Date() }],
      automationRules: [
        { name: 'Offer expiry reminder', cadence: '2 days before expiry', enabled: true },
        { name: 'Approval reminder', cadence: 'Every 24 hours while pending', enabled: true },
        { name: 'Joining reminder', cadence: '5 days before joining', enabled: true },
      ],
      preOnboarding: [
        { step: 'Employee Creation', owner: 'HR Operations', status: 'Pending' },
        { step: 'Document Collection', owner: 'Candidate', status: 'Pending' },
        { step: 'Payroll Setup', owner: 'Payroll', status: 'Pending' },
        { step: 'Department Assignment', owner: 'Hiring Manager', status: 'Pending' },
      ],
      createdBy: req.user?.id,
    });

    await logOfferAction(req, 'Create Offer', `Created offer ${offer.offerId} for ${candidateName}`, null, offer.toObject());
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid data' });
  }
};

export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    if (!canReleaseOffer(offer.status)) {
      return res.status(403).json({
        success: false,
        error: 'Offer must be approved before candidate response status can be updated',
      });
    }
    if (!['Offered', 'Accepted', 'Declined', 'Expired'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Unsupported offer status' });
    }
    offer.status = status as any;
    if (status === 'Accepted') {
      offer.set('preOnboarding', [
        { step: 'Employee Creation', owner: 'HR Operations', status: 'In Progress' },
        { step: 'Document Collection', owner: 'Candidate', status: 'Pending' },
        { step: 'Payroll Setup', owner: 'Payroll', status: 'Pending' },
        { step: 'Department Assignment', owner: 'Hiring Manager', status: 'Pending' },
      ]);

      if (offer.candidateId) {
        const app = await mongoose.model('Application').findById(offer.candidateId);
        if (app) {
          app.set('status', 'Background Verification');
          app.set('backgroundVerification', {
            status: 'In Progress',
            initiatedAt: new Date(),
            checks: {
              identity: 'Pending',
              education: 'Pending',
              employment: 'Pending',
              criminal: 'Pending'
            }
          });
          await app.save();
        }
      }
    }
    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'status-update', message: `Offer marked ${status}`, actor: userName(req), priority: status === 'Accepted' ? 'success' : 'normal', at: new Date() }]);
    await offer.save();
    await logOfferAction(req, 'Update Offer Status', `Updated ${offer.offerId} to ${status}`, null, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Update failed' });
  }
};

export const ceoApproveOffer = async (req: AuthRequest, res: Response) => {
  try {
    const role = normalizeRole(req.user?.role);
    if (role !== 'HR_MANAGER') {
      return res.status(403).json({ success: false, error: 'HR Manager approval only' });
    }
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    if (!isPendingOfferApproval(offer.status)) {
      return res.status(400).json({ success: false, error: 'Offer is not pending HR Manager approval' });
    }
    offer.status = 'Offered';
    offer.approvalStage = 'Ready to Send' as any;
    offer.ceoApprovedBy = req.user?.id as any;
    offer.ceoApprovedAt = new Date();
    offer.set('approvalHistory', [...((offer.get('approvalHistory') as any[]) || []), { role: 'HR_MANAGER', approverName: userName(req), approverId: req.user?.id, action: 'Approved', comments: req.body?.comments || 'HR Manager approved package', at: new Date() }]);
    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'approval', message: 'Offer approved by HR Manager', actor: userName(req), priority: 'success', at: new Date() }]);
    await offer.save();
    await logOfferAction(req, 'Approve Offer', `HR Manager approved ${offer.offerId}`, null, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Approval failed' });
  }
};

export const getOfferDashboard = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await buildOfferAnalytics() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Dashboard failed' });
  }
};

export const getOfferAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const data = await buildOfferAnalytics();
    res.status(200).json({ success: true, data: { analytics: data.analytics, trends: data.trends, overview: data.overview } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Analytics failed' });
  }
};

export const getOfferApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const data = await buildOfferAnalytics();
    res.status(200).json({ success: true, data: data.approvals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Approvals failed' });
  }
};

export const approveOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    const before = offer.toObject();
    offer.status = 'Offered';
    offer.approvalStage = 'Ready to Send' as any;
    offer.set('approvalHistory', [...((offer.get('approvalHistory') as any[]) || []), { role: req.user?.role || 'Approver', approverName: userName(req), approverId: req.user?.id, action: 'Approved', comments: req.body?.comments || 'Approved', at: new Date() }]);
    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'approval', message: `Offer approved by ${req.user?.role || 'approver'}`, actor: userName(req), priority: 'success', at: new Date() }]);
    await offer.save();
    await logOfferAction(req, 'Approve Offer', `Approved ${offer.offerId}`, before, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch {
    res.status(400).json({ success: false, error: 'Approval failed' });
  }
};

export const rejectOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    const before = offer.toObject();
    const requestChanges = Boolean(req.body?.requestChanges);
    offer.status = requestChanges ? 'Changes Requested' as any : 'Declined';
    offer.approvalStage = requestChanges ? 'Changes Requested' as any : 'Rejected' as any;
    offer.set('approvalHistory', [...((offer.get('approvalHistory') as any[]) || []), { role: req.user?.role || 'Approver', approverName: userName(req), approverId: req.user?.id, action: requestChanges ? 'Changes Requested' : 'Rejected', comments: req.body?.comments || (requestChanges ? 'Changes requested' : 'Rejected'), at: new Date() }]);
    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: requestChanges ? 'changes-requested' : 'rejection', message: requestChanges ? 'Offer changes requested by approver' : 'Offer rejected', actor: userName(req), priority: 'high', at: new Date() }]);
    await offer.save();
    await logOfferAction(req, requestChanges ? 'Request Offer Changes' : 'Reject Offer', requestChanges ? `Requested changes for ${offer.offerId}` : `Rejected ${offer.offerId}`, before, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch {
    res.status(400).json({ success: false, error: 'Rejection failed' });
  }
};

export const negotiateOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    const before = offer.toObject();
    const rounds = ((offer.get('negotiationRounds') as any[]) || []);
    const revisedOffer = Number(req.body.revisedOffer || offer.salary);
    if (!Number.isFinite(revisedOffer) || revisedOffer <= 0) {
      return res.status(400).json({ success: false, error: 'Revised offer must be a valid positive amount.' });
    }
    offer.salary = revisedOffer;
    offer.set('compensation', compensationFor(revisedOffer, req.body));
    const status = approvalStatusForSalary(revisedOffer);
    offer.status = status as any;
    offer.approvalStage = isPendingOfferApproval(status) ? 'HR Manager Approval' as any : 'Ready to Send' as any;
    offer.set('negotiationRounds', [...rounds, { round: rounds.length + 1, originalOffer: before.salary, requestedSalary: Number(req.body.requestedSalary || 0), revisedOffer, notes: req.body.notes || 'Negotiation recorded', status: 'Open', at: new Date() }]);
    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'negotiation', message: `Negotiation round ${rounds.length + 1} recorded`, actor: userName(req), priority: 'medium', at: new Date() }]);
    await offer.save();
    await logOfferAction(req, 'Negotiate Offer', `Negotiated ${offer.offerId}`, before, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch {
    res.status(400).json({ success: false, error: 'Negotiation failed' });
  }
};

export const updateOfferDetails = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    const before = offer.toObject();

    const { salary, joiningDate, expiryDate, position, department, bonus, reportingManager, probationDetails } = req.body;

    if (salary !== undefined) {
      const numSalary = Number(salary);
      if (!Number.isFinite(numSalary) || numSalary <= 0) {
        return res.status(400).json({ success: false, error: 'Salary must be a valid positive amount.' });
      }
      offer.salary = numSalary;
      offer.set('compensation', compensationFor(numSalary, req.body));
    }

    if (joiningDate) offer.joiningDate = joiningDate;
    if (expiryDate) offer.expiryDate = new Date(expiryDate);
    if (position) offer.position = position;
    if (department) offer.department = department;
    if (bonus !== undefined) offer.bonus = Number(bonus);
    if (reportingManager !== undefined) offer.reportingManager = reportingManager;
    if (probationDetails !== undefined) offer.probationDetails = probationDetails;

    offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), {
      type: 'offer-updated',
      message: `Offer details updated for ${offer.candidateName}`,
      actor: userName(req),
      priority: 'normal',
      at: new Date(),
    }]);

    await offer.save();
    await logOfferAction(req, 'Update Offer Details', `Updated details for offer ${offer.offerId}`, before, offer.toObject());
    res.status(200).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message || 'Update failed' });
  }
};

export const sendOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    if (!canReleaseOffer(offer.status)) {
      return res.status(409).json({ success: false, error: 'Offer must be approved before it can be sent.' });
    }
    const before = offer.toObject();

    // 1. Fetch the application to resolve the correct position mapping
    let application: any = null;
    if (offer.candidateId) {
      application = await mongoose.model('Application').findById(offer.candidateId);
    }
    if (!application && offer.candidateEmail) {
      application = await mongoose.model('Application').findOne({ email: offer.candidateEmail });
    }
    if (!application && offer.candidateName) {
      application = await mongoose.model('Application').findOne({ name: offer.candidateName });
    }

    // Resolve position: Priority:
    // 1. application.selectedPositionTitle
    // 2. application.positionTitle
    // 3. application.selectedPositionName
    // 4. Job Opening title (fallback only for legacy records)
    let resolvedPosition = offer.position || 'the position';
    if (application) {
      const appPos = application.selectedPositionTitle
        || application.positionTitle
        || application.selectedPositionName;
      if (appPos) {
        resolvedPosition = appPos;
      } else if (application.jobId) {
        const job = await mongoose.model('Job').findById(application.jobId);
        if (job && (job as any).jobTitle) {
          resolvedPosition = (job as any).jobTitle;
        }
      }
    }

    // Get recruiter/HR user contact details
    let hrUser = await User.findById(offer.createdBy);
    if (!hrUser) {
      hrUser = req.user as any; // Fallback to current user
    }

    const companyName = 'InternsLand';
    const expiryDateString = offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A';

    // Update state to Sending/Attempting
    offer.emailStatus = 'Sending';
    offer.lastEmailAttempt = new Date();
    await offer.save();

    // Temporarily overlay resolved position on the offer document for the PDF generator
    const originalPos = offer.position;
    offer.position = resolvedPosition;

    let pdfBuffer: Buffer;
    try {
      // 2. Generate PDF using resolved position
      pdfBuffer = await generateOfferLetterPdfBuffer(offer, hrUser);
    } catch (pdfError: any) {
      console.error('PDF Generation Failed:', pdfError);
      // Restore original position
      offer.position = originalPos;
      offer.emailStatus = 'Failed';
      offer.emailFailureReason = pdfError?.message || 'PDF Generation failed';
      offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'offer-failed', message: 'Offer email delivery failed.', actor: userName(req), priority: 'high', at: new Date() }]);
      await offer.save();
      return res.status(500).json({ success: false, error: 'PDF generation failed: ' + (pdfError?.message || '') });
    }

    // Restore original position
    offer.position = originalPos;

    try {
      // 3. Deliver Email with PDF attachment using resolved position
      const emailPayload = {
        companyName,
        candidateName: offer.candidateName,
        position: resolvedPosition,
        department: offer.department || '',
        recruiterName: hrUser ? `${hrUser.firstName} ${hrUser.lastName || ''}`.trim() : 'HR Team',
        expiryDate: expiryDateString,
        joiningDate: offer.joiningDate || '',
        secureLink: offer.secureLink || `/offers/secure/${offer.offerId}`,
        hrPhone: hrUser?.phoneNumber || '',
        hrEmail: hrUser?.email || '',
      };

      const mailResult = await sendOfferEmail(offer.candidateEmail || '', emailPayload, pdfBuffer);

      if (!mailResult.success) {
        throw new Error(mailResult.reason || 'SMTP transmission failure');
      }

      // 4. Successful State Update
      offer.status = 'Offered';
      offer.approvalStage = 'Sent' as any;
      offer.sentAt = new Date();
      offer.emailStatus = 'Sent';
      offer.emailSentAt = new Date();
      offer.emailFailureReason = '';
      offer.emailMessageId = mailResult.messageId || '';
      offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'offer-sent', message: 'Offer email successfully sent to candidate.', actor: userName(req), priority: 'normal', at: new Date() }]);
      
      await offer.save();
      await logOfferAction(req, 'Send Offer', `Sent ${offer.offerId}`, before, offer.toObject());

      return res.status(200).json({ success: true, data: offer });
    } catch (emailError: any) {
      console.error('Email Transmission Failed:', emailError);
      offer.emailStatus = 'Failed';
      offer.emailFailureReason = emailError?.message || 'SMTP transmission failure';
      offer.set('activityHistory', [...((offer.get('activityHistory') as any[]) || []), { type: 'offer-failed', message: 'Offer email delivery failed.', actor: userName(req), priority: 'high', at: new Date() }]);
      await offer.save();

      return res.status(500).json({ success: false, error: 'Email delivery failed: ' + (emailError?.message || '') });
    }
  } catch (error: any) {
    console.error('Send Offer overall error:', error);
    return res.status(400).json({ success: false, error: error?.message || 'Send failed' });
  }
};

export const getOfferPdf = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });

    let hrUser = await User.findById(offer.createdBy);
    if (!hrUser) {
      hrUser = req.user as any;
    }

    const pdfBuffer = await generateOfferLetterPdfBuffer(offer, hrUser);

    const formattedName = (offer.candidateName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const version = offer.negotiationRounds?.length ? `_V${offer.negotiationRounds.length + 1}` : '';
    const filename = `Offer_Letter_${formattedName}${version}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('Download Offer PDF error:', error);
    return res.status(500).json({ success: false, error: 'PDF generation failed: ' + (error?.message || '') });
  }
};
