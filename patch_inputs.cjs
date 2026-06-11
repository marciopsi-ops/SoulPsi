const fs = require('fs');

const fileNames = [
  'src/components/Dashboard.tsx',
  'src/components/Checkout.tsx',
  'src/components/CompanyRegistration.tsx',
  'src/components/PatientRegistration.tsx'
];

for (const fileName of fileNames) {
  if (!fs.existsSync(fileName)) continue;
  let content = fs.readFileSync(fileName, 'utf8');

  // We want to add these strictly to inputs, selects, and textareas.
  // The easiest way is to use a regex that finds <input ... className="... "
  
  content = content.replace(/(<(?:input|textarea|select)[^>]*className=["'])([^"']*)(["'])/gi, (match, prefix, classNames, suffix) => {
    let classes = classNames.split(' ').filter(c => c);
    
    // Check if it already has text- colors
    if (!classes.some(c => c.startsWith('text-slate-'))) {
        classes.push('text-slate-900', 'dark:text-slate-100');
    }
    // Check if it has a background
    if (!classes.some(c => c.startsWith('bg-'))) {
        classes.push('bg-white', 'dark:bg-slate-800');
    } else if (classes.some(c => c === 'bg-white') && !classes.some(c => c === 'dark:bg-slate-800')) {
        classes.push('dark:bg-slate-800');
    }
    
    // Make sure dark mode borders are visible
    if (classes.some(c => c.startsWith('border-slate-')) && !classes.some(c => c.startsWith('dark:border-slate-'))) {
       classes.push('dark:border-slate-700');
    }

    return prefix + classes.join(' ') + suffix;
  });

  fs.writeFileSync(fileName, content, 'utf8');
}
console.log('patched');
