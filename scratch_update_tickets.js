const fs = require('fs');

function processTickets() {
  let content = fs.readFileSync('src/pages/modules/payroll/Tickets.jsx', 'utf8');

  // Replace imports
  content = content.replace(
    'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";',
    'import { DataTable } from "@/components/ui/data-table";\nimport { ActionIcon } from "@/components/ui/action-icon";\nimport { Eye, CheckCircle2, XCircle } from "lucide-react";'
  );

  // Replace Table in TicketListTable
  const tableStart = content.indexOf('<Table>');
  const paginationEnd = content.indexOf(')}', content.indexOf('<Pagination', tableStart));
  
  const columnsCode = `
  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => (
        <div className="w-full flex flex-col items-center justify-center text-center">
          <span className="font-medium">{row.original.employeeName}</span>
          <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">{row.original.employeeCode || "N/A"}</span>
        </div>
      )
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => <div className="w-full flex justify-center text-center font-mono text-sm text-muted-foreground">{row.original.employeeCode || "-"}</div>
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="w-full flex justify-center text-center">
          <Badge variant="outline" className={row.original.type === "advance" ? "text-sky-600" : "text-violet-600"}>
            {row.original.type === "advance" ? "Salary Advance" : "Travel Ticket"}
          </Badge>
        </div>
      )
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const t = row.original;
        return t.type === "advance" ? (
          <div className="w-full flex justify-center text-center">
            <span className="text-black dark:text-white">₹{Number(t.amount || 0).toLocaleString()}</span>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center">
            <span className="text-sm">{t.destination || "—"}</span>
            <span className="text-xs text-muted-foreground">
              {t.ticketClass ? t.ticketClass.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "—"}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="w-full flex justify-center text-center text-sm">
          <div className="max-w-[200px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        </div>
      )
    },
    ...(mode === "all" ? [{
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="w-full flex justify-center text-center">
          <Badge variant="outline" className={STATUS_COLORS[row.original.status] || ""}>{row.original.status}</Badge>
        </div>
      )
    }] : []),
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="w-full flex justify-center text-center text-sm text-muted-foreground whitespace-nowrap">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
        </div>
      )
    },
    ...(mode === "pending" ? [{
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="w-full flex justify-center text-center">
          <PendingRowActions ticket={row.original} onDone={load} />
        </div>
      )
    }] : [])
  ];
`;

  const returnIndex = content.indexOf('return (', content.indexOf('const TicketListTable'));
  content = content.substring(0, returnIndex) + columnsCode + '\n  ' + content.substring(returnIndex);

  const tableBlockStart = content.indexOf('<Table>');
  const pagEnd = content.indexOf(')}', content.indexOf('<Pagination', tableBlockStart));
  content = content.substring(0, tableBlockStart) + '<DataTable columns={columns} data={filtered} />' + content.substring(pagEnd + 2);

  // Replace Action Buttons in PendingRowActions
  // There are two places where they appear. Let's just do a regex for Button with Eye, Check, X
  content = content.replace(/<Button\s+size="icon"[^>]*?>\s*<Eye[^>]*?>\s*<\/Button>/g, '<ActionIcon icon={Eye} tooltip="View Details" onClick={() => setViewOpen(true)} className="text-purple-600" />');
  
  // To handle the onClick safely, I'll be more specific:
  content = content.replace(
    /<Button[\s\S]*?onClick=\{\(\) => setViewOpen\(true\)\}[\s\S]*?<Eye[\s\S]*?<\/Button>/g,
    '<ActionIcon icon={Eye} tooltip="View Details" onClick={() => setViewOpen(true)} className="text-purple-600" />'
  );
  content = content.replace(
    /<Button[\s\S]*?onClick=\{async \(\) => \{[\s\S]*?\}[\s\S]*?<Check[\s\S]*?<\/Button>/g,
    (match) => {
      let clickCode = match.match(/onClick=\{async \(\) => \{[\s\S]*?\}\}/)[0];
      return \`<ActionIcon icon={CheckCircle2} tooltip="Approve" \${clickCode} className="text-green-600" />\`;
    }
  );
  content = content.replace(
    /<Button[\s\S]*?onClick=\{\(\) => setRejectOpen\(true\)\}[\s\S]*?<X[\s\S]*?<\/Button>/g,
    '<ActionIcon icon={XCircle} tooltip="Reject" onClick={() => setRejectOpen(true)} className="text-red-600" />'
  );

  fs.writeFileSync('src/pages/modules/payroll/Tickets.jsx', content);
}

processTickets();
