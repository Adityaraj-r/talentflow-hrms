import re
import os

file_path = r'c:\web development\HRMS\frontend\src\pages\modules\employee-center\DigitalLocker.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add missing imports
if 'Tooltip' not in content:
    content = re.sub(
        r'(import { Button } from "@/components/ui/button";)',
        r'\1\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";',
        content
    )
if 'Table,' not in content:
    content = re.sub(
        r'(import { Button } from "@/components/ui/button";)',
        r'\1\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";',
        content
    )

# 2. Upload Button to Tooltip
upload_btn_regex = r'<DialogTrigger asChild>\s*<Button\s*className="bg-blue-600 hover:bg-blue-700 shrink-0 cursor-pointer"\s*onClick=\{\(\) => \{\s*setUploadCategory\([^;]+;\s*setDocumentTitle\(""\);\s*\}\}\s*>\s*<Upload className="w-4 h-4 mr-2 hidden sm:block" /> Upload\s*</Button>\s*</DialogTrigger>'

new_upload_btn = '''<TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                            onClick={() => {
                              setUploadCategory(selectedCategory === "All" || selectedCategory === "Onboarding" ? "Onboarding" : selectedCategory);
                              setDocumentTitle("");
                            }}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload Document</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>'''

content = re.sub(upload_btn_regex, new_upload_btn, content)

# 3. Fix BadgeStatus
content = re.sub(
    r'const styles = \{ Verified: "bg-green-100 text-green-700", Pending: "bg-yellow-100 text-yellow-700", Rejected: "bg-red-100 text-red-700" \};',
    r'const styles = { Verified: "bg-green-500/10 text-green-600 border-green-200", Pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200", Rejected: "bg-red-500/10 text-red-600 border-red-200" };',
    content
)

# 4. Fix Category Links (make them sleeker)
content = re.sub(
    r'className=\{\`flex-shrink-0 flex items-center justify-between rounded-lg text-sm font-medium transition-colors cursor-pointer gap-3 px-3 py-1\.5 border lg:w-full lg:px-4 lg:py-3 lg:border-none \$\{selectedCategory === cat\.name\s*\?\s*"bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"\s*:\s*"bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"\}\`\}',
    r'className={`flex-shrink-0 flex items-center justify-between rounded-md text-sm font-medium transition-colors cursor-pointer gap-3 px-3 py-2 lg:w-full lg:px-4 lg:py-2.5 ${selectedCategory === cat.name ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}',
    content
)

content = re.sub(
    r'span className=\{\`text-xs px-2 py-0\.5 rounded-full min-w-\[1\.5rem\] text-center \$\{selectedCategory === cat\.name\s*\?\s*"bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"\s*:\s*"bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"\}\`\}',
    r'span className={`text-xs px-2 py-0.5 rounded-full min-w-[1.5rem] text-center ${selectedCategory === cat.name ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}',
    content
)

content = re.sub(
    r'<Folder className=\{\`w-4 h-4 lg:w-5 lg:h-5 \$\{selectedCategory === cat\.name \? "fill-blue-600 text-blue-600" : "text-gray-400"\}\`\} />',
    r'<Folder className={`w-4 h-4 lg:w-5 lg:h-5 ${selectedCategory === cat.name ? "fill-slate-900 text-slate-900 dark:fill-white dark:text-white" : "text-slate-400"}`} />',
    content
)

# 5. Fix tables to use UI Table component
content = re.sub(
    r'<table className="w-full text-sm text-left">\s*<thead className="bg-gray-50 dark:bg-gray-900 border-b">\s*<tr>',
    r'<Table>\n                    <TableHeader>\n                      <TableRow className="bg-muted/30">',
    content
)
content = re.sub(
    r'</tr>\s*</thead>\s*<tbody className="divide-y">',
    r'</TableRow>\n                    </TableHeader>\n                    <TableBody>',
    content
)
content = re.sub(
    r'</tbody>\s*</table>',
    r'</TableBody>\n                  </Table>',
    content
)
content = re.sub(
    r'<tr key=\{emp\._id\} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">',
    r'<TableRow key={emp._id} className="hover:bg-muted/10">',
    content
)
content = re.sub(
    r'<tr key=\{doc\._id\} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">',
    r'<TableRow key={doc._id} className="hover:bg-muted/10">',
    content
)
content = re.sub(r'<tr><td', r'<TableRow><TableCell', content)
content = re.sub(r'</td></tr>', r'</TableCell></TableRow>', content)
content = re.sub(r'</tr>', r'</TableRow>', content)
content = re.sub(r'<th ', r'<TableHead ', content)
content = re.sub(r'</th>', r'</TableHead>', content)
content = re.sub(r'<td ', r'<TableCell ', content)
content = re.sub(r'</td>', r'</TableCell>', content)

# 6. Make grid cards cleaner
content = re.sub(
    r'className="group relative bg-white dark:bg-gray-800 p-4 rounded-xl border hover:shadow-md transition-all flex flex-col"',
    r'className="group relative bg-white dark:bg-slate-900 p-4 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col"',
    content
)
content = re.sub(
    r'className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">',
    r'className="p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl">',
    content
)
content = re.sub(
    r'<FileText className="w-6 h-6 text-blue-500" />',
    r'<FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" />',
    content
)

# 7. Make left nav card cleaner
content = re.sub(
    r'className="flex-shrink-0 w-full bg-white dark:bg-gray-900 p-2 border-b flex gap-2 overflow-x-auto no-scrollbar lg:w-64 lg:bg-white lg:dark:bg-gray-900 lg:border lg:rounded-xl lg:shadow-sm lg:block lg:space-y-2 lg:overflow-y-auto lg:p-4 h-full"',
    r'className="flex-shrink-0 w-full bg-white dark:bg-slate-900 p-2 border-b flex gap-2 overflow-x-auto no-scrollbar lg:w-64 lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:rounded-[16px] lg:shadow-sm lg:block lg:space-y-1 lg:overflow-y-auto lg:p-3 h-full"',
    content
)

# 8. Main container inner padding
content = re.sub(
    r'className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50"',
    r'className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-900/30"',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
