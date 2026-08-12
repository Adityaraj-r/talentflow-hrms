import re

file_path = r'c:\web development\HRMS\frontend\src\pages\role\HR_MANAGER\DocumentRequests.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'Tooltip' not in content:
    content = re.sub(
        r'(import { Button } from "@/components/ui/button";)',
        r'\1\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";',
        content
    )
if 'MessageSquarePlus' not in content:
    content = re.sub(
        r'CheckCircle2, XCircle, Clock, Download, FileText, Eye } from "lucide-react";',
        r'CheckCircle2, XCircle, Clock, Download, FileText, Eye, MessageSquarePlus } from "lucide-react";',
        content
    )

# 1. Fix Typography and Header layout
content = re.sub(
    r'<div className="space-y-6">\s*<div>\s*<h1 className="text-3xl font-bold tracking-tight">Document Requests \(HR Manager Supervision\)</h1>\s*<p className="text-muted-foreground">Monitor and supervise employee document requests</p>\s*</div>',
    r'''<div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">Document Requests (HR Manager Supervision)</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Monitor and supervise employee document requests</p>
        </div>
      </div>''',
    content
)

# 2. Fix Card box styling
content = re.sub(
    r'<Card>',
    r'<Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">',
    content
)

# 3. Fix raw html table to Table component
content = re.sub(
    r'<table className="w-full text-sm text-left">\s*<thead className="bg-muted/50 border-b">\s*<tr>',
    r'<Table>\n                <TableHeader>\n                  <TableRow className="bg-muted/30">',
    content
)
content = re.sub(
    r'</tr>\s*</thead>\s*<tbody className="divide-y">',
    r'</TableRow>\n                </TableHeader>\n                <TableBody>',
    content
)
content = re.sub(
    r'</tbody>\s*</table>',
    r'</TableBody>\n              </Table>',
    content
)
content = re.sub(r'<tr key=\{req\._id\} className="group hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">', r'<TableRow key={req._id} className="hover:bg-muted/10 group">', content)
content = re.sub(r'<tr><td', r'<TableRow><TableCell', content)
content = re.sub(r'</td></tr>', r'</TableCell></TableRow>', content)
content = re.sub(r'</tr>', r'</TableRow>', content)
content = re.sub(r'<th ', r'<TableHead ', content)
content = re.sub(r'</th>', r'</TableHead>', content)
content = re.sub(r'<td ', r'<TableCell ', content)
content = re.sub(r'</td>', r'</TableCell>', content)

# 4. Replace Action text buttons with Tooltip Icon buttons
old_actions_regex = r'<Button \s*variant="outline" \s*size="sm" \s*className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"\s*onClick=\{\(\) => handleOpenViewDetails\(req\)\}\s*>\s*View Details\s*</Button>\s*(?:\{req\.status !== "Rejected" \? \(\s*<Button \s*variant="ghost" \s*size="sm" \s*className="h-8 px-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-150 focus:ring-2 focus:ring-blue-500 focus:outline-none"\s*onClick=\{\(\) => handleOpenAddRemark\(req\)\}\s*>\s*Add Remark\s*</Button>\s*\) : null\})?'

new_actions = r'''<TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 shrink-0"
                                  onClick={() => handleOpenViewDetails(req)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View Details</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {req.status !== "Rejected" ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0"
                                    onClick={() => handleOpenAddRemark(req)}
                                  >
                                    <MessageSquarePlus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Add Remark</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}'''

content = re.sub(old_actions_regex, new_actions, content)

# 5. Table import
if 'Table,' not in content:
    content = re.sub(
        r'(import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";)',
        r'\1\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";',
        content
    )


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
