import re
import os

file_path = r'c:\web development\HRMS\frontend\src\pages\modules\transfer\EmployeeTransfer.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'StatsCard' not in content:
    content = re.sub(
        r'(import { Textarea } from "@/components/ui/textarea")',
        r'\1\nimport { StatsCard } from "@/components/ui/stats-card"\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"',
        content
    )

# Replace StatCard elements
content = re.sub(
    r'<StatCard title="Total Requests" value=\{stats\.total\} icon=\{<ArrowLeftRight className="h-5 w-5[^}]+} [^>]+ />',
    r'<StatsCard title="Total Requests" value={stats.total} icon={<ArrowLeftRight />} variant="blue" />',
    content
)
content = re.sub(
    r'<StatCard title="Approved" value=\{stats\.approved\} icon=\{<CheckCircle2 className="h-5 w-5[^}]+} [^>]+ />',
    r'<StatsCard title="Approved" value={stats.approved} icon={<CheckCircle2 />} variant="green" />',
    content
)
content = re.sub(
    r'<StatCard title="Pending" value=\{stats\.pending\} icon=\{<Clock className="h-5 w-5[^}]+} [^>]+ />',
    r'<StatsCard title="Pending" value={stats.pending} icon={<Clock />} variant="orange" />',
    content
)
content = re.sub(
    r'<StatCard title="Rejected" value=\{stats\.rejected\} icon=\{<XCircle className="h-5 w-5[^}]+} [^>]+ />',
    r'<StatsCard title="Rejected" value={stats.rejected} icon={<XCircle />} variant="red" />',
    content
)

# Replace buttons
content = re.sub(
    r'<Button size="sm" onClick=\{\(\) => setInitiateModalOpen\(true\)\}>\s*<ArrowLeftRight className="h-4 w-4 mr-2" /> Initiate Transfer\s*</Button>',
    r'''<TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={() => setInitiateModalOpen(true)} className="h-9 w-9 shrink-0">
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Initiate Transfer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>''',
    content
)

content = re.sub(
    r'<Button variant="outline" size="sm" onClick=\{\(\) => toast\.success\("Compiling Approved Transfers for Export\.\.\."\)\}>\s*<FileText className="h-4 w-4 mr-2" /> Export Pipeline\s*</Button>',
    r'''<TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => toast.success("Compiling Approved Transfers for Export...")} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export Pipeline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>''',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
