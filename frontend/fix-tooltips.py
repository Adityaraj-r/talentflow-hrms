import re
import os

files = [
    r'c:\web development\HRMS\frontend\src\pages\modules\employee-center\AllEmployees.jsx',
    r'c:\web development\HRMS\frontend\src\pages\modules\administration\UserManagement.jsx',
    r'c:\web development\HRMS\frontend\src\pages\modules\recruitment\JobOpenings.jsx'
]

replacement_template = '''<TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={{export_fn}} disabled={{export_disabled}} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExporting ? "Exporting..." : "Export CSV"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={{sync_fn}} disabled={isLoading} className="h-9 w-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 text-slate-500">
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sync Data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>'''

for f_path in files:
    if not os.path.exists(f_path):
        continue
    with open(f_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Tooltip imports
    if 'TooltipProvider' not in content:
        content = re.sub(
            r'(import { Button } from "@/components/ui/button")',
            r'\1\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"',
            content
        )

    if 'JobOpenings' in f_path:
        export_fn = 'exportToCSV'
        export_disabled = 'jobs.length === 0 || isExporting'
        sync_fn = 'fetchJobs'
    elif 'UserManagement' in f_path:
        export_fn = 'exportToCSV'
        export_disabled = 'users.length === 0 || isExporting'
        sync_fn = 'fetchUsers'
    else: # AllEmployees
        export_fn = 'exportToCSV'
        export_disabled = 'employees.length === 0 || isExporting'
        sync_fn = 'fetchEmployees'
        
    repl = replacement_template.replace('{export_fn}', export_fn).replace('{export_disabled}', export_disabled).replace('{sync_fn}', sync_fn)
    
    # regex match for the buttons block
    content = re.sub(
        r'<Button variant="outline" size="sm" onClick=\{[^}]+\} disabled=\{[^}]+\} className="group relative overflow-hidden.*?<RefreshCw className=\{cn.*?</Button>',
        repl,
        content,
        flags=re.DOTALL
    )

    with open(f_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done')
