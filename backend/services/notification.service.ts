import mongoose from 'mongoose';
import User from '../models/User.model';
import {
  NotificationModel,
  NotificationType,
} from '../models/Notification';
import { AppraisalCycleModel } from '../models/AppraisalCycle';
import { PerformanceReviewModel } from '../models/PerformanceReview';
import { WorkflowStage, canonicalStatus } from './pmsWorkflow.service';
export interface NotificationFilters {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}

/** Broadcast once when appraisal cycle becomes ACTIVE */
export async function broadcastCycleActive(appraisalCycleId: string): Promise<{ sent: number }> {
  const cycle = await AppraisalCycleModel.findById(appraisalCycleId).exec();
  if (!cycle || cycle.isDeleted) {
    throw new Error('Appraisal cycle not found');
  }

  if (cycle.broadcastActiveSentAt) {
    return { sent: 0 };
  }

  const employees = await User.find({
    role: 'EMPLOYEE',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  })
    .select('_id')
    .lean();

  const title = `Appraisal cycle active: ${cycle.name}`;
  const body =
    'A new appraisal cycle is now active. Please complete your goals and self-assessment as instructed by HR.';

  let sent = 0;
  const docs = employees.map((u) => ({
    userId: u._id,
    type: NotificationType.APPRAISAL_CYCLE_ACTIVE,
    title,
    body,
    metadata: {
      appraisalCycleId: cycle._id.toString(),
      performanceCycleId: cycle.performanceCycleId.toString(),
    },
    isDeleted: false,
  }));

  if (docs.length > 0) {
    await NotificationModel.insertMany(docs);
    sent = docs.length;
  }

  cycle.broadcastActiveSentAt = new Date();
  await cycle.save();

  return { sent };
}

/** Single employee notification when results are published (cycle PROCESSED). */
export async function notifyResultPublished(
  employeeUserId: mongoose.Types.ObjectId | string,
  appraisalCycleId: string
): Promise<void> {
  const cycle = await AppraisalCycleModel.findById(appraisalCycleId).lean();
  if (!cycle) return;

  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeUserId)),
    type: NotificationType.APPRAISAL_RESULT_PUBLISHED,
    title: `Appraisal results published: ${cycle.name}`,
    body:
      'Your appraisal results for this cycle are now available. Open Performance to view details.',
    metadata: {
      appraisalCycleId,
      performanceCycleId: cycle.performanceCycleId.toString(),
    },
    isDeleted: false,
  });
}

/** Notify manager when every review they own in the cycle has reached manager_review_done or beyond. */
export async function notifyTeamComplete(
  managerUserId: mongoose.Types.ObjectId | string,
  appraisalCycleId: string
): Promise<void> {
  const cycle = await AppraisalCycleModel.findById(appraisalCycleId).lean();
  if (!cycle) return;

  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(managerUserId)),
    type: NotificationType.TEAM_APPRAISALS_COMPLETE,
    title: `Team appraisals submitted: ${cycle.name}`,
    body:
      'All assigned team reviews for this cycle have progressed past manager submission for your direct reports.',
    metadata: {
      appraisalCycleId,
      performanceCycleId: cycle.performanceCycleId.toString(),
    },
    isDeleted: false,
  });
}

export async function markRead(
  userId: mongoose.Types.ObjectId | string,
  notificationId: string
): Promise<boolean> {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const nid = new mongoose.Types.ObjectId(notificationId);

  const res = await NotificationModel.updateOne(
    {
      _id: nid,
      userId: uid,
      isDeleted: { $ne: true },
    },
    { $set: { readAt: new Date() } }
  ).exec();

  return res.modifiedCount > 0;
}

export async function getNotifications(
  userId: mongoose.Types.ObjectId | string,
  filters: NotificationFilters = {}
): Promise<{ items: unknown[]; total: number }> {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const limit = Math.min(Math.max(filters.limit ?? 30, 1), 100);
  const skip = Math.max(filters.skip ?? 0, 0);

  const query: Record<string, unknown> = {
    userId: uid,
    isDeleted: { $ne: true },
  };

  if (filters.unreadOnly) {
    query.readAt = null;
  }

  const [items, total] = await Promise.all([
    NotificationModel.find(query)
      .sort({ readAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    NotificationModel.countDocuments(query).exec(),
  ]);

  return { items, total };
}

/**
 * Detect managers whose assigned reviews in this performance cycle all have manager stage complete.
 * Inserts one notification per manager (deduped by skipping if same cycle already notified — optional enhancement).
 */
export async function evaluateAndNotifyManagersTeamComplete(
  performanceCycleId: mongoose.Types.ObjectId | string
): Promise<void> {
  const pid =
    typeof performanceCycleId === 'string'
      ? new mongoose.Types.ObjectId(performanceCycleId)
      : performanceCycleId;

  const cycleDoc = await AppraisalCycleModel.findOne({
    performanceCycleId: pid,
    isDeleted: { $ne: true },
  }).lean();

  const appraisalCycleIdStr = cycleDoc?._id?.toString();
  if (!appraisalCycleIdStr) return;

  const reviews = await PerformanceReviewModel.find({ cycleId: pid }).exec();
  const byReviewer = new Set<string>();
  for (const r of reviews) {
    if (r.reviewerId) {
      byReviewer.add((r.reviewerId as mongoose.Types.ObjectId).toString());
    }
  }

  const mgrReviewDoneOrBeyond = (status: string | undefined): boolean => {
    const s = canonicalStatus(status);
    const order = [
      WorkflowStage.MANAGER_REVIEW_DONE,
      WorkflowStage.HR_REVIEWED,
      WorkflowStage.CEO_REVIEWED,
      WorkflowStage.CALIBRATED,
      WorkflowStage.FINAL_APPROVED,
      WorkflowStage.FEEDBACK_RELEASED,
    ];
    return order.includes(s as (typeof order)[number]);
  };

  for (const reviewerKey of byReviewer) {
    const subset = reviews.filter(
      (r) => (r.reviewerId as mongoose.Types.ObjectId).toString() === reviewerKey
    );
    if (subset.length === 0) continue;
    const allDone = subset.every((r) => mgrReviewDoneOrBeyond(r.status));
    if (!allDone) continue;

    const reviewerOid = new mongoose.Types.ObjectId(reviewerKey);
    const dup = await NotificationModel.exists({
      userId: reviewerOid,
      type: NotificationType.TEAM_APPRAISALS_COMPLETE,
      'metadata.appraisalCycleId': appraisalCycleIdStr,
      isDeleted: { $ne: true },
    }).exec();
    if (dup) continue;

    await notifyTeamComplete(reviewerOid, appraisalCycleIdStr);
  }
}
export async function notifyPayrollRejected(
  recipientUserId: mongoose.Types.ObjectId | string,
  payrollId: string,
  reason: string,
  rejectedAtStage: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(recipientUserId)),
    type: NotificationType.PAYROLL_REJECTED,
    title: `Payroll run rejected at ${rejectedAtStage}`,
    body: `Reason: ${reason}`,
    metadata: { payrollId, rejectedAtStage },
    isDeleted: false,
  });
}
export async function notifyPayrollRegenerated(
  recipientUserId: mongoose.Types.ObjectId | string,
  payrollId: string,
  previousStage: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(recipientUserId)),
    type: NotificationType.PAYROLL_REJECTED, // reuse same type, or add PAYROLL_REGENERATED if you want a distinct icon/route
    title: `Payroll run regenerated — awaiting your review again`,
    body: `The run you rejected at ${previousStage} has been fixed and resubmitted.`,
    metadata: { payrollId, previousStage },
    isDeleted: false,
  });
}
export async function notifyPayrollPendingCEOApproval(
  payrollId: string,
  totalNet: number
): Promise<void> {
  const ceos = await User.find({
    role: 'CEO',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');

  if (!ceos.length) return;

  const docs = ceos.map((u) => ({
    userId: u._id,
    type: NotificationType.PAYROLL_PENDING_CEO_APPROVAL,
    title: 'Payroll run awaiting your approval',
    body: `A payroll run with total net ₹${totalNet.toLocaleString('en-IN')} has cleared HR approval and needs your sign-off.`,
    metadata: { payrollId },
    isDeleted: false,
  }));

  await NotificationModel.insertMany(docs);
}
export async function notifyPayrollPendingFinanceApproval(
  payrollId: string,
  totalNet: number
): Promise<void> {
  const financeManagers = await User.find({
    role: 'FINANCE_MANAGER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');

  if (!financeManagers.length) return;

  const docs = financeManagers.map((u) => ({
    userId: u._id,
    type: NotificationType.PAYROLL_PENDING_FINANCE_APPROVAL,
    title: 'Payroll run awaiting your verification',
    body: `A payroll run with total net ₹${totalNet.toLocaleString('en-IN')} has more than 10 employees and needs Finance verification.`,
    metadata: { payrollId },
    isDeleted: false,
  }));

  await NotificationModel.insertMany(docs);
}
export async function notifyIndemnityRejected(
  recipientUserId: mongoose.Types.ObjectId | string,
  indemnityId: string,
  reason: string,
  rejectedAtStage: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(recipientUserId)),
    type: NotificationType.INDEMNITY_REJECTED,
    title: `Indemnity request rejected at ${rejectedAtStage}`,
    body: `Reason: ${reason}`,
    metadata: { indemnityId, rejectedAtStage },
    isDeleted: false,
  });
}

export async function notifyIndemnityResubmitted(indemnityId: string): Promise<void> {
  const financeManagers = await User.find({
    role: 'FINANCE_MANAGER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!financeManagers.length) return;
  await NotificationModel.insertMany(
    financeManagers.map((u) => ({
      userId: u._id,
      type: NotificationType.INDEMNITY_RESUBMITTED,
      title: 'Indemnity request resubmitted',
      body: 'A previously rejected indemnity request has been resubmitted for verification.',
      metadata: { indemnityId },
      isDeleted: false,
    }))
  );
}

export async function notifyIndemnityPendingHRApproval(indemnityId: string, employeeName: string): Promise<void> {
  const hrManagers = await User.find({
    role: 'HR_MANAGER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!hrManagers.length) return;
  await NotificationModel.insertMany(
    hrManagers.map((u) => ({
      userId: u._id,
      type: NotificationType.INDEMNITY_PENDING_HR_APPROVAL,
      title: 'Indemnity request awaiting your approval',
      body: `Indemnity request for ${employeeName} has cleared Finance verification and needs HR approval.`,
      metadata: { indemnityId },
      isDeleted: false,
    }))
  );
}

export async function notifyIndemnityPendingCEOApproval(indemnityId: string, employeeName: string): Promise<void> {
  const ceos = await User.find({
    role: 'CEO',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!ceos.length) return;
  await NotificationModel.insertMany(
    ceos.map((u) => ({
      userId: u._id,
      type: NotificationType.INDEMNITY_PENDING_CEO_APPROVAL,
      title: 'Indemnity request awaiting your approval',
      body: `Indemnity request for ${employeeName} has cleared HR approval and needs your sign-off.`,
      metadata: { indemnityId },
      isDeleted: false,
    }))
  );
}

export async function notifyIndemnityApproved(
  recipientUserId: mongoose.Types.ObjectId | string,
  indemnityId: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(recipientUserId)),
    type: NotificationType.INDEMNITY_APPROVED,
    title: 'Indemnity request fully approved',
    body: 'The indemnity request you submitted has been approved by the CEO and is ready to be marked paid.',
    metadata: { indemnityId },
    isDeleted: false,
  });
}
export async function notifyIndemnityPendingFinanceApproval(indemnityId: string, employeeName: string): Promise<void> {
  const financeManagers = await User.find({
    role: 'FINANCE_MANAGER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!financeManagers.length) return;
  await NotificationModel.insertMany(
    financeManagers.map((u) => ({
      userId: u._id,
      type: NotificationType.INDEMNITY_PENDING_FINANCE_APPROVAL,
      title: 'New indemnity request awaiting verification',
      body: `A new indemnity request for ${employeeName} needs your verification.`,
      metadata: { indemnityId },
      isDeleted: false,
    }))
  );
}
export async function notifyTicketPendingFinanceApproval(ticketId: string, ticketType: string): Promise<void> {
  const financeManagers = await User.find({
    role: 'FINANCE_MANAGER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!financeManagers.length) return;
  await NotificationModel.insertMany(
    financeManagers.map((u) => ({
      userId: u._id,
      type: NotificationType.TICKET_PENDING_FINANCE_APPROVAL,
      title: 'New ticket awaiting verification',
      body: `A new ${ticketType} ticket needs your verification.`,
      metadata: { ticketId },
      isDeleted: false,
    }))
  );
}

export async function notifyTicketPendingPayrollApproval(ticketId: string, ticketType: string): Promise<void> {
  const payrollOfficers = await User.find({
    role: 'PAYROLL_OFFICER',
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  }).select('_id');
  if (!payrollOfficers.length) return;
  await NotificationModel.insertMany(
    payrollOfficers.map((u) => ({
      userId: u._id,
      type: NotificationType.TICKET_PENDING_PAYROLL_APPROVAL,
      title: 'Ticket awaiting your approval',
      body: `A ${ticketType} ticket has cleared Finance verification and needs Payroll approval.`,
      metadata: { ticketId },
      isDeleted: false,
    }))
  );
}

export async function notifyTicketApproved(
  employeeId: mongoose.Types.ObjectId | string,
  ticketId: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeId)),
    type: NotificationType.TICKET_APPROVED,
    title: 'Your ticket was approved',
    body: 'Your request has been fully approved.',
    metadata: { ticketId },
    isDeleted: false,
  });
}

export async function notifyTicketRejected(
  employeeId: mongoose.Types.ObjectId | string,
  ticketId: string,
  reason: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeId)),
    type: NotificationType.TICKET_REJECTED,
    title: 'Your ticket was rejected',
    body: `Reason: ${reason}`,
    metadata: { ticketId },
    isDeleted: false,
  });
}
export async function notifyTaskAssigned(
  employeeId: mongoose.Types.ObjectId | string,
  taskId: string,
  taskTitle: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeId)),
    type: NotificationType.TASK_ASSIGNED,
    title: "New task assigned",
    body: `You have been assigned the task "${taskTitle}".`,
    metadata: { taskId },
    isDeleted: false,
  });
}


export async function notifyTaskInProgress(
  userId: mongoose.Types.ObjectId | string,
  taskId: string,
  taskTitle: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.TASK_IN_PROGRESS,
    title: "Task in progress",
    body: `The task "${taskTitle}" is now in progress.`,
    metadata: { taskId },
    isDeleted: false,
  });
}


export async function notifyTaskCompleted(
  creatorId: mongoose.Types.ObjectId | string,
  taskId: string,
  taskTitle: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(creatorId)),
    type: NotificationType.TASK_COMPLETED,
    title: "Task completed",
    body: `The task "${taskTitle}" has been completed.`,
    metadata: { taskId },
    isDeleted: false,
  });
}
export async function notifyLeaveRequested(
  managerId: mongoose.Types.ObjectId | string,
  leaveId: string,
  employeeName: string,
  leaveType: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(managerId)),
    type: NotificationType.LEAVE_REQUESTED,
    title: "New leave request",
    body: `${employeeName} has requested ${leaveType} leave.`,
    metadata: {
      leaveId,
      employeeName,
      leaveType,
      startDate,
      endDate,
    },
    isDeleted: false,
  });
}


export async function notifyLeaveApproved(
  employeeId: mongoose.Types.ObjectId | string,
  leaveId: string,
  leaveType: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeId)),
    type: NotificationType.LEAVE_APPROVED,
    title: "Leave approved",
    body: `Your ${leaveType} leave request has been approved.`,
    metadata: {
      leaveId,
      leaveType,
      startDate,
      endDate,
    },
    isDeleted: false,
  });
}


export async function notifyLeaveRejected(
  employeeId: mongoose.Types.ObjectId | string,
  leaveId: string,
  leaveType: string,
  startDate: Date,
  endDate: Date,
  rejectionReason: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(employeeId)),
    type: NotificationType.LEAVE_REJECTED,
    title: "Leave rejected",
    body: `Your ${leaveType} leave request has been rejected. Reason: ${rejectionReason}`,
    metadata: {
      leaveId,
      leaveType,
      startDate,
      endDate,
      rejectionReason,
    },
    isDeleted: false,
  });
}
export async function notifyDisciplinaryCaseCreated(
  userId: mongoose.Types.ObjectId | string,
  caseId: string,
  employeeName: string,
  category: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.DISCIPLINARY_CASE_CREATED,
    title: "New disciplinary case",
    body: `A new disciplinary case (${caseId}) has been created for ${employeeName}. Category: ${category}.`,
    metadata: { caseId },
    isDeleted: false,
  });
}

export async function notifyDisciplinaryReviewRequested(
  userId: mongoose.Types.ObjectId | string,
  caseId: string,
  employeeName: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.DISCIPLINARY_REVIEW_REQUESTED,
    title: "Disciplinary review requested",
    body: `A disciplinary case (${caseId}) requires your review for ${employeeName}.`,
    metadata: { caseId },
    isDeleted: false,
  });
}

export async function notifyDisciplinaryCaseInProgress(
  userId: mongoose.Types.ObjectId | string,
  caseId: string,
  employeeName: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.DISCIPLINARY_CASE_IN_PROGRESS,
    title: "Disciplinary case in progress",
    body: `The disciplinary case (${caseId}) for ${employeeName} is now in progress.`,
    metadata: { caseId },
    isDeleted: false,
  });
}

export async function notifyDisciplinaryCaseCompleted(
  userId: mongoose.Types.ObjectId | string,
  caseId: string,
  employeeName: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.DISCIPLINARY_CASE_COMPLETED,
    title: "Disciplinary case completed",
    body: `The disciplinary case (${caseId}) for ${employeeName} has been completed.`,
    metadata: { caseId },
    isDeleted: false,
  });
}
export async function notifyTransferRequested(
  userId: mongoose.Types.ObjectId | string,
  transferId: string,
  employeeName: string,
  currentDepartment: string,
  newDepartment: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.TRANSFER_REQUESTED,
    title: "New transfer request",
    body: `${employeeName} has requested a transfer from ${currentDepartment} to ${newDepartment}.`,
    metadata: {
      transferId,
      employeeName,
      currentDepartment,
      newDepartment,
    },
    isDeleted: false,
  });
}


export async function notifyTransferManagerRecommendation(
  userId: mongoose.Types.ObjectId | string,
  transferId: string,
  employeeName: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.TRANSFER_MANAGER_RECOMMENDATION,
    title: "Transfer recommendation submitted",
    body: `A manager has submitted a recommendation for ${employeeName}'s transfer request.`,
    metadata: {
      transferId,
      employeeName,
    },
    isDeleted: false,
  });
}


export async function notifyTransferApproved(
  userId: mongoose.Types.ObjectId | string,
  transferId: string,
  employeeName: string,
  newDepartment: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.TRANSFER_APPROVED,
    title: "Transfer approved",
    body: `Your transfer request for ${employeeName} has been approved. Your new department is ${newDepartment}.`,
    metadata: {
      transferId,
      employeeName,
      newDepartment,
    },
    isDeleted: false,
  });
}


export async function notifyTransferRejected(
  userId: mongoose.Types.ObjectId | string,
  transferId: string,
  employeeName: string,
  reason: string
): Promise<void> {
  await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    type: NotificationType.TRANSFER_REJECTED,
    title: "Transfer request rejected",
    body: `The transfer request for ${employeeName} has been rejected. Reason: ${reason}`,
    metadata: {
      transferId,
      employeeName,
      reason,
    },
    isDeleted: false,
  });
} 