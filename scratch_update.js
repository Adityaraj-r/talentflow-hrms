const fs = require('fs');

function processSalarySlip() {
  let content = fs.readFileSync('src/pages/modules/payroll/SalarySlip.jsx', 'utf8');

  // Replace imports
  content = content.replace(
    'import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"',
    'import { DataTable } from "@/components/ui/data-table"\nimport { ActionIcon } from "@/components/ui/action-icon"\nimport { Eye } from "lucide-react"'
  );

  // Replace Table in EmployeeSlipView
  const tableStart = content.indexOf('<Table>');
  const tableEnd = content.indexOf('</Table>') + '</Table>'.length;
  
  const columnsCode = `
  const columns = [
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => <span className="font-medium">{row.original.month} {row.original.year}</span>
    },
    {
      accessorKey: "netPay",
      header: "Net Salary",
      cell: ({ row }) => <span className="font-bold text-green-600">Rs. {Number(row.original.netPay || 0).toLocaleString()}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline" className={STATUS_COLORS[row.original.status] || ""}>{row.original.status}</Badge>
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        const isOpening = openingPayrollId === String(r.payrollId);
        const isDownloading = downloading;
        return (
          <div className="flex gap-2">
            <ActionIcon icon={isOpening ? Loader2 : FileText} tooltip={activeSlip?.payrollId === String(r.payrollId) ? "Hide" : "View"} onClick={() => void openSlip(r)} disabled={openingPayrollId !== null && openingPayrollId !== String(r.payrollId)} className={isOpening ? "animate-spin" : ""} />
            <ActionIcon icon={isDownloading ? Loader2 : Download} tooltip="Download PDF" onClick={() => void handleDownload(String(r.payrollId))} disabled={downloading} className={isDownloading ? "animate-spin text-purple-600" : "text-purple-600"} />
          </div>
        );
      }
    }
  ];
`;

  // Insert columns definition before return
  const returnIndex = content.indexOf('return (', content.indexOf('const EmployeeSlipView'));
  content = content.substring(0, returnIndex) + columnsCode + '\n  ' + content.substring(returnIndex);

  // Replace Table JSX
  const newTable = `<DataTable columns={columns} data={records} />`;
  // We also need to remove the pagination since DataTable handles it if it's generic, but here we just pass data={records}. Wait, I'll pass all records and let DataTable paginate. 
  // Wait, I also need to remove the <Pagination ... /> below the Table.
  content = content.replace(/<Table>[\s\S]*?<\/Table>\s*\{records\.length > 0 && \([\s\S]*?<\/>\s*\)}/m, newTable); // Regex might be tricky. Let's do string replacement.
  
  // A better way: replace everything from <Table> to <Pagination ... /> with <DataTable />
  const tableBlockStart = content.indexOf('<Table>');
  const paginationEnd = content.indexOf(')}', content.indexOf('<Pagination'));
  content = content.substring(0, tableBlockStart) + '<DataTable columns={columns} data={records} />' + content.substring(paginationEnd + 2); // ')}'.length

  fs.writeFileSync('src/pages/modules/payroll/SalarySlip.jsx', content);
}

processSalarySlip();
