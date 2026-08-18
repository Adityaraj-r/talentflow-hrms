const fs = require('fs');

function processPayroll() {
  let content = fs.readFileSync('src/pages/modules/payroll/Payroll.jsx', 'utf8');

  // Replace imports
  content = content.replace(
    'import { DataTable } from "@/components/ui/data-table";',
    'import { DataTable } from "@/components/ui/data-table";\nimport { ActionIcon } from "@/components/ui/action-icon";\nimport { StatsCard } from "@/components/ui/stats-card";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";'
  );

  // StatsCards replacement
  const cardsCode = `
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard title="Total Records" value={records.length} icon={Users} variant="purple" />
        <StatsCard title="Pending This Month" value={pending.length} icon={AlertCircle} variant="amber" />
        <StatsCard title="Paid This Month" value={records.filter(r => ["Paid", "Disbursed", "Locked"].includes(r.status)).reduce((sum, r) => sum + (r.employees?.length || 0), 0)} icon={CheckCircle} variant="emerald" />
      </div>
  `;
  
  const gridStart = content.indexOf('<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">');
  const gridEnd = content.indexOf('</div>', content.indexOf('Paid This Month', gridStart)) + '</div>'.length; // that is the end of the 3rd card... wait, we need the end of the grid.
  // We can just regex replace the whole block
  content = content.replace(/<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">[\s\S]*?<div className="flex gap-1 border-b/, cardsCode.trim() + '\n\n      <div className="flex gap-1 border-b');

  // native selects replacements
  content = content.replace(/<select\s+className="p-2 border rounded-md bg-white text-black dark:bg-slate-800 dark:text-white text-sm"\s+value=\{month\}\s+onChange=\{e => setMonth\(e.target.value\)\}\s*>[\s\S]*?<\/select>/, `<Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>`);

  content = content.replace(/<select\s+className="p-2 border rounded-md bg-white text-black dark:bg-slate-800 dark:text-white text-sm"\s+value=\{runKind\}\s+onChange=\{\(e\) => setRunKind\(e.target.value\)\}\s*>[\s\S]*?<\/select>/, `<Select value={runKind} onValueChange={setRunKind}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular Payroll</SelectItem>
              <SelectItem value="off_cycle">Off Cycle Payroll</SelectItem>
            </SelectContent>
          </Select>`);
          
  content = content.replace(/<select\s+className="w-full p-2 border rounded-md bg-white text-black dark:bg-slate-800 dark:text-white"\s+value=\{selectedEmp\}\s+onChange=\{e => setSelectedEmp\(e.target.value\)\}\s+disabled=\{loading\}\s*>[\s\S]*?<\/select>/, `<Select value={selectedEmp} onValueChange={setSelectedEmp} disabled={loading}>
                      <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "-- Choose Employee --"} /></SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map(emp => (
                          <SelectItem key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} — {emp.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>`);

  fs.writeFileSync('src/pages/modules/payroll/Payroll.jsx', content);
}

processPayroll();
