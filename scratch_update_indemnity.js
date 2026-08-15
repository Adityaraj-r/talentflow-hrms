const fs = require('fs');

function processIndemnity() {
  let content = fs.readFileSync('src/pages/modules/payroll/Indemnity.jsx', 'utf8');

  // Imports
  content = content.replace(
    'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";',
    'import { DataTable } from "@/components/ui/data-table";\nimport { ActionIcon } from "@/components/ui/action-icon";\nimport { Eye, CheckCircle2, XCircle, Download, FileText, Pencil, Trash2 } from "lucide-react";'
  );

  // PendingIndemnities columns
  const pendingColumnsCode = `
  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="font-medium min-w-[160px]">
            {r.employeeName}
            {r.rejectedAtStage && r.status !== "Rejected" && (
              <p className="text-xs text-red-500 font-normal mt-1 leading-snug">
                Rejected by {STAGE_LABELS[r.rejectedAtStage]?.replace("Awaiting ", "") || r.rejectedAtStage}
                {r.rejectionReason ? \`: \${r.rejectionReason}\` : " — no reason given"}
              </p>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => row.original.employeeCode || "—"
    },
    {
      accessorKey: "years",
      header: "Years",
      cell: ({ row }) => \`\${row.original.roundedYearsOfService ?? row.original.yearsOfService} yrs\`
    },
    {
      accessorKey: "amount",
      header: "Gratuity Amount",
      cell: ({ row }) => <span className="font-bold text-purple-600">₹ {Number(row.original.calculatedAmount).toLocaleString("en-IN")}</span>
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="capitalize">{row.original.reason}</span>
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <Badge variant="outline" className="whitespace-nowrap">{STAGE_LABELS[row.original.workflowStage] || row.original.workflowStage}</Badge>
        </div>
      )
    },
    {
      accessorKey: "date",
      header: "Requested",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
    {
      id: "view",
      header: "View",
      cell: ({ row }) => <ActionIcon icon={Eye} tooltip="View Details" onClick={() => setViewingRecord(row.original)} />
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        const myTurn = canActOnStage(r.workflowStage);
        if (!myTurn) {
          return <span className="text-xs text-muted-foreground">Not your turn</span>;
        }
        if (r.workflowStage === "REJECTED_RESUBMIT") {
          return (
            <Button size="sm" variant="outline" onClick={() => startEditing(r)}>
              Edit & Resubmit
            </Button>
          );
        }
        if (rejectingId === r._id) {
          return (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Textarea
                placeholder="Reason (optional)"
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-1">
                <Button size="sm" variant="destructive" onClick={() => handleReject(r)}>Confirm reject</Button>
                <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleApprove(r)}>
              <Check className="h-4 w-4 mr-1" />
              {r.workflowStage === "APPROVED" ? "Mark Paid" : "Approve"}
            </Button>
            {r.workflowStage !== "APPROVED" && (
              <ActionIcon icon={XCircle} tooltip="Reject" onClick={() => setRejectingId(r._id)} className="text-rose-600 hover:text-rose-700" />
            )}
          </div>
        );
      }
    }
  ];
`;

  const pendingTableBlockStart = content.indexOf('<Table>', content.indexOf('PendingIndemnities = () => {'));
  const pendingTableBlockEnd = content.indexOf(')}', content.indexOf('<Pagination', pendingTableBlockStart)) + 2;
  const pendingReturnIndex = content.indexOf('return (', content.indexOf('const totalPages', content.indexOf('PendingIndemnities = () => {')));
  
  content = content.substring(0, pendingReturnIndex) + pendingColumnsCode + '\n  ' + content.substring(pendingReturnIndex, pendingTableBlockStart) + '<DataTable columns={columns} data={paginatedRecords} />\n      ' + content.substring(pendingTableBlockEnd);


  // History columns
  const historyColumnsCode = `
  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => (
        <div className="font-medium min-w-[160px]">
          {row.original.employeeName}
        </div>
      )
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => row.original.employeeCode || "—"
    },
    {
      accessorKey: "years",
      header: "Years",
      cell: ({ row }) => \`\${row.original.roundedYearsOfService ?? row.original.yearsOfService} yrs\`
    },
    {
      accessorKey: "amount",
      header: "EOSB Amount",
      cell: ({ row }) => <span className="font-bold text-purple-600">₹ {Number(row.original.calculatedAmount).toLocaleString("en-IN")}</span>
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="capitalize">{row.original.reason}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={STATUS_COLORS[row.original.status] || ""}>
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
    {
      id: "view",
      header: "View",
      cell: ({ row }) => <ActionIcon icon={Eye} tooltip="View Details" onClick={() => setViewingRecord(row.original)} />
    }
  ];
`;

  const historyTableBlockStart = content.indexOf('<Table className="min-w-[900px]">', content.indexOf('IndemnityHistory = () => {'));
  const historyTableBlockEnd = content.indexOf(')}', content.indexOf('<Pagination', historyTableBlockStart)) + 2;
  const historyReturnIndex = content.indexOf('return (', content.indexOf('const totalPages', content.indexOf('IndemnityHistory = () => {')));
  
  content = content.substring(0, historyReturnIndex) + historyColumnsCode + '\n  ' + content.substring(historyReturnIndex, historyTableBlockStart) + '<DataTable columns={columns} data={paginatedFiltered} />\n      ' + content.substring(historyTableBlockEnd);

  fs.writeFileSync('src/pages/modules/payroll/Indemnity.jsx', content);
}

processIndemnity();
