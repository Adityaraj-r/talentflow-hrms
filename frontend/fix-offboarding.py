import re
import os

file_path = r'c:\web development\HRMS\frontend\src\pages\modules\transfer\OffboardingRequests.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Table and Tooltip imports
if 'Table,' not in content:
    content = re.sub(
        r'(import { Textarea } from "@/components/ui/textarea")',
        r'\1\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"\nimport { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"',
        content
    )

# Replace Initiate Separation button
content = re.sub(
    r'<Button variant="destructive" onClick=\{\(\) => setInitiateModalOpen\(true\)\}>\s*Initiate Separation\s*</Button>',
    r'''<TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setInitiateModalOpen(true)} className="h-9 w-9 shrink-0 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Initiate Separation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>''',
    content
)

# Replace raw table with UI Table
content = re.sub(
    r'<table className="w-full text-sm text-left">\s*<thead className="bg-muted/50 border-b">\s*<tr className="whitespace-nowrap">\s*<th className="px-4 py-3 font-medium">Employee</th>\s*<th className="px-4 py-3 font-medium text-center">Department</th>\s*<th className="px-4 py-3 font-medium text-center">Type</th>\s*<th className="px-4 py-3 font-medium">LWD \(Proposed\)</th>\s*<th className="px-4 py-3 font-medium text-center">Status</th>\s*<th className="px-4 py-3 font-medium text-center">Actions</th>\s*</tr>\s*</thead>\s*<tbody className="divide-y">',
    r'''<Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold w-[25%]">Employee</TableHead>
                  <TableHead className="font-bold text-center w-[15%]">Department</TableHead>
                  <TableHead className="font-bold text-center w-[15%]">Type</TableHead>
                  <TableHead className="font-bold w-[15%]">LWD (Proposed)</TableHead>
                  <TableHead className="font-bold text-center w-[20%]">Status</TableHead>
                  <TableHead className="font-bold text-center w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>''',
    content
)

content = re.sub(
    r'</tbody>\s*</table>',
    r'</TableBody>\n            </Table>',
    content
)

# Replace tr with TableRow in the loading state
content = re.sub(
    r'<tr>\s*<td colSpan=\{6\} className="p-8 text-center text-muted-foreground">\s*<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />\s*Loading pipeline\.\.\.\s*</td>\s*</tr>',
    r'<TableRow><TableCell colSpan={6} className="h-64 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground space-y-2"><Loader2 className="h-8 w-8 animate-spin opacity-50" /><p className="text-sm font-medium">Loading pipeline...</p></div></TableCell></TableRow>',
    content
)

# Replace tr with TableRow in empty state
content = re.sub(
    r'<tr>\s*<td colSpan=\{6\} className="p-8 text-center text-muted-foreground">\s*Pipeline is empty\. No active separations matching criteria\.\s*</td>\s*</tr>',
    r'<TableRow><TableCell colSpan={6} className="h-64 text-center"><div className="flex flex-col items-center justify-center text-muted-foreground space-y-2"><UserMinus className="h-10 w-10 opacity-20" /><p className="text-sm font-medium">Pipeline is empty. No active separations matching criteria.</p></div></TableCell></TableRow>',
    content
)

# Replace the data row mapping
content = re.sub(r'<tr key=\{req\._id\} className="hover:bg-muted/20 transition-colors">', r'<TableRow key={req._id} className="hover:bg-muted/10 transition-colors">', content)
content = re.sub(r'<td className="px-4 py-3">', r'<TableCell>', content)
content = re.sub(r'<td className="px-4 py-3 text-center">', r'<TableCell className="text-center">', content)
content = re.sub(r'<td className="px-4 py-3 font-medium whitespace-nowrap text-sm">', r'<TableCell className="font-medium whitespace-nowrap text-sm">', content)
content = re.sub(r'</tr>', r'</TableRow>', content)
content = re.sub(r'</td>', r'</TableCell>', content)

# Lighter Badge Colors for Type
content = re.sub(
    r'req\.type\?\.toLowerCase\(\)\.includes\("resignation"\) \? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800" :',
    r'req.type?.toLowerCase().includes("resignation") ? "bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :',
    content
)
content = re.sub(
    r'req\.type\?\.toLowerCase\(\)\.includes\("termination"\) \? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800" :',
    r'req.type?.toLowerCase().includes("termination") ? "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :',
    content
)
content = re.sub(
    r'req\.type\?\.toLowerCase\(\)\.includes\("absconding"\) \? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800" :',
    r'req.type?.toLowerCase().includes("absconding") ? "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" :',
    content
)
content = re.sub(
    r'"bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800"',
    r'"bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"',
    content
)

# Status colors - also make lighter to match
content = re.sub(
    r'req\.status === \'Withdrawal Pending\' \? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" :',
    r'req.status === \'Withdrawal Pending\' ? "bg-orange-500/10 text-orange-600 border-orange-200" :',
    content
)
content = re.sub(
    r'req\.status === "Exited" \? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" :',
    r'req.status === "Exited" ? "bg-green-500/10 text-green-600 border-green-200" :',
    content
)
content = re.sub(
    r'req\.status\.includes\("High Priority"\) \? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300" :',
    r'req.status.includes("High Priority") ? "bg-red-500/10 text-red-600 border-red-200" :',
    content
)
content = re.sub(
    r'req\.status\.includes\("Withdrawn"\) \? "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300" :',
    r'req.status.includes("Withdrawn") ? "bg-slate-500/10 text-slate-600 border-slate-200" :',
    content
)
content = re.sub(
    r'req\.status\.includes\("Rejected"\) \? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :',
    r'req.status.includes("Rejected") ? "bg-red-500/10 text-red-600 border-red-200" :',
    content
)
content = re.sub(
    r'req\.status\?\.includes\("Pending"\) \? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" :',
    r'req.status?.includes("Pending") ? "bg-blue-500/10 text-blue-600 border-blue-200" :',
    content
)
content = re.sub(
    r'req\.status\?\.includes\("Exit Clearance"\) \? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" :',
    r'req.status?.includes("Exit Clearance") ? "bg-purple-500/10 text-purple-600 border-purple-200" :',
    content
)
content = re.sub(
    r'"bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"',
    r'"bg-yellow-500/10 text-yellow-600 border-yellow-200"',
    content
)

# Button styling fixes
content = re.sub(
    r'variant="outline"\s+size="sm"\s+className="h-7 text-\[11px\]"',
    r'variant="outline" size="sm" className="h-8 text-[11px] font-medium bg-white hover:bg-slate-50 border-slate-200"',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
