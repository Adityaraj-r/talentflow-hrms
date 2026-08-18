  import { formatDistanceToNow } from "date-fns";
  import { useNavigate } from "react-router-dom";
  import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
  import type { NotificationItem, NotificationType } from "@/api/pmsApi";
  import {
    BellRing,
    CheckCircle2,
    Users,
    ClipboardList,
    UserPlus,
  } from "lucide-react";
  import { useAuth } from "@/contexts/AuthContext";
  import { cn } from "@/lib/utils";

  function iconForType(type: NotificationType) {
  switch (type) {
    case "appraisal_cycle_active":
      return BellRing;

    case "appraisal_result_published":
      return CheckCircle2;

    case "team_appraisals_complete":
      return Users;

    case "performance_review_assigned":
    case "self_assessment_submitted":
    case "manager_review_submitted":
    case "hr_review_submitted":
    case "ceo_review_submitted":
    case "calibration_completed":
    case "review_final_approved":
    case "feedback_released":
      return ClipboardList;

    case "bonus_processed":
      return CheckCircle2;

    case "pip_created":
    case "pip_milestone_completed":
    case "pip_completed":
    case "pip_failed":
    case "pip_cancelled":
      return ClipboardList;

    // Keep all your existing cases below this point
    case "payroll_pending_ceo_approval":
    case "payroll_pending_finance_approval":
      return ClipboardList;

    case "task_assigned":
    case "task_in_progress":
    case "task_completed":
      return ClipboardList;

    case "leave_requested":
    case "leave_approved":
    case "leave_rejected":
      return ClipboardList;

    case "disciplinary_case_created":
    case "disciplinary_review_requested":
    case "disciplinary_case_in_progress":
    case "disciplinary_case_completed":
      return ClipboardList;

    case "transfer_requested":
    case "transfer_manager_recommendation":
    case "transfer_approved":
    case "transfer_rejected":
      return ClipboardList;
    case "goals_confirmed":
      return ClipboardList;

    case "referral_created":
    case "referral_applied":
    case "referral_cancelled":
    case "referral_expired":
      return UserPlus;
    case "overtime_approved":
    case "correction_request_approved":
    case "correction_request_rejected":
      return ClipboardList;
    case "document_request_created":
    case "document_request_approved":
    case "document_request_rejected":
    case "document_request_remark_added":
      return ClipboardList;
    case "referral_submitted":
    case "referral_status_updated":
    case "referral_candidate_hired":
    case "referral_reward_created":
    case "referral_probation_passed":
    case "referral_reward_approved":
    case "referral_reward_paid":
    case "referral_expiring_soon":
      return UserPlus;
    default:
      return ClipboardList;
  }
}

  function routeForNotification(
    type: NotificationType,
    metadata: NotificationItem["metadata"],
    roleUpper: string
  ): string {
    const appraisalId = metadata?.appraisalCycleId as string | undefined;

    switch (type) {
      case "appraisal_result_published":
        return "/employee/appraisal-result";
      case "appraisal_cycle_active": {
        if (
          roleUpper === "HR_MANAGER" ||
          roleUpper === "HR_OFFICER" ||
          roleUpper === "ADMIN" ||
          roleUpper === "SUPER_ADMIN" ||
          roleUpper === "CEO"
        ) {
          return appraisalId ? `/pms/appraisal-cycles/${appraisalId}` : "/pms/appraisal-cycles";
        }
        if (roleUpper === "EMPLOYEE") return "/role/employee/appraisal";
        if (roleUpper === "DIRECT_MANAGER") return "/role/direct_manager/appraisal";
        return "/dashboard";
      }
      case "team_appraisals_complete":
        return "/role/direct_manager/appraisal";
      case "performance_review_assigned":
        return "/role/employee/appraisal";

      case "self_assessment_submitted":
      case "manager_review_submitted":
      case "hr_review_submitted":
      case "ceo_review_submitted":
      case "calibration_completed":
      case "review_final_approved":
      case "feedback_released":
        return "/pms";

      case "bonus_processed":
        return "/employee/appraisal-result";

      case "pip_created":
      case "pip_milestone_completed":
      case "pip_completed":
      case "pip_failed":
      case "pip_cancelled":
        return "/pms/pips";
      case "payroll_pending_ceo_approval":
        return "/ceo/payroll";
      case "payroll_pending_finance_approval":
        return "/payroll"; // Finance Manager's payroll records tab — adjust if they have a dedicated route like /ceo/payroll does  
      case "indemnity_rejected":
      case "indemnity_resubmitted":
      case "indemnity_pending_hr_approval":
      case "indemnity_pending_ceo_approval":
      case "indemnity_approved":
      case "indemnity_pending_finance_approval": 
      case "ticket_pending_finance_approval":
      case "ticket_pending_payroll_approval":
      case "ticket_approved":
      case "ticket_rejected": 
        return "/indemnity";
      case "task_assigned":
      case "task_in_progress":
      case "task_completed":
        return "/dashboard/employee/tasks";
      case "leave_requested":
      case "leave_approved":
      case "leave_rejected":
        return "/time-attendance";
      case "disciplinary_case_created":
      case "disciplinary_review_requested":
      case "disciplinary_case_in_progress":
      case "disciplinary_case_completed":
        return "/disciplinary";
      case "transfer_requested":
      case "transfer_manager_recommendation":
      case "transfer_approved":
      case "transfer_rejected":
        return "/transfer";
      case "referral_created": {
        // No dedicated HR referrals-review page exists yet — send HR to job openings for now.
        if (roleUpper === "HR_MANAGER" || roleUpper === "HR_OFFICER") {
          return "/dashboard/job-openings";
        }
        return "/employee/referrals";
      }

      case "referral_applied": {
        // The referred candidate now has a real Application record — HR can find them there.
        if (roleUpper === "HR_MANAGER" || roleUpper === "HR_OFFICER") {
          return "/dashboard/applications";
        }
        return "/employee/referrals";
      }

      case "referral_cancelled":
      case "referral_expired":
        // Employee-only notifications, no HR variant sent for these.
        return "/employee/referrals";
      case "overtime_approved":
      case "correction_request_approved":
      case "correction_request_rejected":
        return "/attendance/my-leaves";
      case "document_request_created":
        if (roleUpper === "HR_MANAGER") {
          return "/role/hr_manager/document-requests";
        }

        if (roleUpper === "HR_OFFICER") {
          return "/role/hr_officer/document-requests";
        }

        return "/role/employee/document-requests";

      case "document_request_approved":
      case "document_request_rejected":
      case "document_request_remark_added":
        return "/role/employee/document-requests";
      case "referral_reward_approved":
      case "referral_reward_created":
      case "referral_reward_paid":
      case "referral_probation_passed":
      case "referral_candidate_hired": {
        if (roleUpper === "HR_MANAGER" || roleUpper === "HR_OFFICER" || roleUpper === "FINANCE_MANAGER") {
          return "/payroll/referrals";
        }
        return "/employee/referrals";
      }

      case "referral_submitted":
      case "referral_status_updated":
      case "referral_expiring_soon":
        return "/employee/referrals";
      default:
        return "/dashboard";
    }
  }

  interface NotificationDropdownProps {
    items: NotificationItem[];
    onSelect: (n: NotificationItem) => void;
  }

  export function NotificationDropdown({ items, onSelect }: NotificationDropdownProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const roleUpper = String(
      typeof user?.role === "string" ? user.role : user?.role?.name || ""
    )
      .toUpperCase()
      .replace(/\s+/g, "_");

    const sorted = [...items].sort((a, b) => {
      const ua = a.readAt ? 1 : 0;
      const ub = b.readAt ? 1 : 0;
      if (ua !== ub) return ua - ub;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const shown = sorted.slice(0, 10);

    return (
      <DropdownMenuContent align="end" className="z-50 w-96 p-0">
        <DropdownMenuLabel className="px-3 py-2">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {shown.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="max-h-[min(380px,70vh)] overflow-y-auto">
            <div className="flex flex-col py-1">
              {shown.map((n) => {
                const Icon = iconForType(n.type);
                const unread = !n.readAt;
                return (
                  <DropdownMenuItem
                    key={n._id}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1 rounded-none px-3 py-3",
                      unread && "bg-muted/50"
                    )}
                    onClick={() => {
                      onSelect(n);
                      const path = routeForNotification(n.type, n.metadata, roleUpper);
                      navigate(path);
                    }}
                  >
                    <div className="flex w-full gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </div>
        )}
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    );
  }
