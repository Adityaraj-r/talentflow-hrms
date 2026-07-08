const fs = require('fs');

const files = [
  'c:/Users/91808/Downloads/Task/HRMS/frontend/src/pages/modules/recruitment/OfferOperations.jsx',
  'c:/Users/91808/Downloads/Task/HRMS/frontend/src/pages/modules/recruitment/Onboarding.jsx',
  'c:/Users/91808/Downloads/Task/HRMS/frontend/src/components/recruitment/OfferOperationsPlatform.jsx',
  'c:/Users/91808/Downloads/Task/HRMS/frontend/src/components/recruitment/RecruitmentUI.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Background replacements
  content = content.replace(/bg-slate-950\/70/g, 'bg-white dark:bg-slate-950/70');
  content = content.replace(/bg-slate-950\/95/g, 'bg-white/95 dark:bg-slate-950/95');
  content = content.replace(/bg-slate-950\b(?![\/])/g, 'bg-slate-50 dark:bg-slate-950');
  
  // Text replacements
  content = content.replace(/text-slate-100\b/g, 'text-slate-900 dark:text-slate-100');
  content = content.replace(/text-slate-200\b/g, 'text-slate-800 dark:text-slate-200');
  content = content.replace(/text-slate-300\b/g, 'text-slate-700 dark:text-slate-300');
  content = content.replace(/text-slate-400\b/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/text-slate-950\b/g, 'text-white dark:text-slate-950');
  content = content.replace(/text-white\b/g, 'text-slate-900 dark:text-white');
  
  // Border replacements
  content = content.replace(/border-white\/10\b/g, 'border-slate-200 dark:border-white/10');
  
  // More background replacements
  content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-slate-50 dark:bg-white/[0.03]');
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50 dark:bg-white/[0.02]');
  content = content.replace(/bg-white\/5\b/g, 'bg-slate-100 dark:bg-white/5');
  content = content.replace(/bg-white\/10\b/g, 'bg-slate-200 dark:bg-white/10');
  
  // Hover replacements
  content = content.replace(/hover:bg-white\/10\b/g, 'hover:bg-slate-200 dark:hover:bg-white/10');
  content = content.replace(/hover:bg-white\/\[0\.03\]/g, 'hover:bg-slate-100 dark:hover:bg-white/[0.03]');
  
  // Specific tweaks
  content = content.replace(/bg-black\/20\b/g, 'bg-slate-100 dark:bg-black/20');
  content = content.replace(/text-cyan-300\b/g, 'text-cyan-600 dark:text-cyan-300');
  content = content.replace(/text-cyan-200\b/g, 'text-cyan-700 dark:text-cyan-200');
  content = content.replace(/bg-cyan-300\b/g, 'bg-cyan-600 dark:bg-cyan-300');
  content = content.replace(/hover:bg-cyan-200\b/g, 'hover:bg-cyan-700 dark:hover:bg-cyan-200');

  fs.writeFileSync(file, content);
});
console.log("Done other components");
