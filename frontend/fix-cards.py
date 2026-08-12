import re

file_path = r'c:\web development\HRMS\frontend\src\components\reports\DashboardSection.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'Trophy' not in content:
    content = re.sub(r'import {([^}]*)} from \"lucide-react\";', r'import {\1, Trophy, TrendingDown, UserX } from "lucide-react";', content)

# Replace Best Department
content = re.sub(
    r'<div className=\"bg-white dark:bg-slate-900 rounded-\[16px\] border border-slate-200 dark:border-slate-800 shadow-sm p-6\">\s*<p className=\"text-xs font-semibold uppercase tracking-wider text-muted-foreground\">\s*Best Department\s*</p>\s*<h3 className=\"text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5\">\s*(\{data\?\.ceoInsights\?\.bestDepartment \|\| \"[^\"]*\"})\s*</h3>\s*</div>',
    r'''<div className="group relative bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 transition-all duration-300 ease-out hover:-translate-y-1 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Best Department
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
                    \1
                  </h3>
                </div>
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Trophy size={18} />
                </div>
              </div>
            </div>''',
    content
)

# Replace Highest Attrition
content = re.sub(
    r'<div className=\"bg-white dark:bg-slate-900 rounded-\[16px\] border border-slate-200 dark:border-slate-800 shadow-sm p-6\">\s*<p className=\"text-xs font-semibold uppercase tracking-wider text-muted-foreground\">\s*Highest Attrition\s*</p>\s*<h3 className=\"text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5\">\s*(\{data\?\.ceoInsights\?\.highestAttrition \|\| \"[^\"]*\"})\s*</h3>\s*</div>',
    r'''<div className="group relative bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 transition-all duration-300 ease-out hover:-translate-y-1 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Highest Attrition
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
                    \1
                  </h3>
                </div>
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <TrendingDown size={18} />
                </div>
              </div>
            </div>''',
    content
)

# Replace Lowest Attendance
content = re.sub(
    r'<div className=\"bg-white dark:bg-slate-900 rounded-\[16px\] border border-slate-200 dark:border-slate-800 shadow-sm p-6\">\s*<p className=\"text-xs font-semibold uppercase tracking-wider text-muted-foreground\">\s*Lowest Attendance\s*</p>\s*<h3 className=\"text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5\">\s*(\{data\?\.ceoInsights\?\.lowestAttendance \|\| \"[^\"]*\"})\s*</h3>\s*</div>',
    r'''<div className="group relative bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 transition-all duration-300 ease-out hover:-translate-y-1 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lowest Attendance
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
                    \1
                  </h3>
                </div>
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <UserX size={18} />
                </div>
              </div>
            </div>''',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
