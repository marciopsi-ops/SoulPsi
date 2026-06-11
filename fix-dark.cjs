const fs = require('fs');

function fixColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find all className="..." that contain text-slate-X (where X is 500,600,700,800,900) 
  // and dark:bg-slate-800 but NOT dark:text-slate-* OR dark:text-gray-*
  
  // We can do it broadly:
  // If className contains "dark:bg-slate-800" or "dark:bg-slate-900" 
  // and does not contain "dark:text-", let's inject " dark:text-slate-100"
  let lines = content.split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="') || lines[i].includes("className='") || lines[i].includes('className={`')) {
       // simple regex to find className values
       // actually, let's just use string replace on lines
       let m = lines[i].match(/className=(?:["'`])(.*?)(?:["'`]|\$})/); // simplistic, but okay
       if (m) {
           let classStr = m[1];
           if (classStr.includes('dark:bg-slate-800') || classStr.includes('dark:bg-slate-900') || classStr.includes('dark:bg-gray-800') || classStr.includes('dark:bg-gray-900')) {
                if (!classStr.includes('dark:text-')) {
                   // Inject it right before the background class
                   let updated = lines[i].replace('dark:bg-', 'dark:text-slate-100 dark:bg-');
                   lines[i] = updated;
                   changed = true;
                }
           }
       }
    }
  }

  // Also replace any specific textarea instances that might not be caught, or just general dark:bg-slate-800 replacements
  // Wait, the regex might miss multiline classNames.
  
  content = lines.join('\n');
  
  // Also, add dark:placeholder:text-slate-400 to text, textarea, select if they have placeholder but no dark:placeholder
  // Actually, just replacing "text-slate-600 " ... with "text-slate-600 dark:text-slate-100 " might be better.
  
  // A safe replacement: find `text-slate-600` or `text-slate-500` or `text-slate-700` in combination with `dark:bg-slate-800`
  // Actually, let's just globally replace `dark:bg-slate-800 dark:border-slate-700` with `dark:text-slate-100 dark:bg-slate-800 dark:border-slate-700` if it doesn't already have dark:text.
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['src/components/Dashboard.tsx', 'src/components/LandingPage.tsx'].forEach(f => {
  if (fs.existsSync(f)) {
    fixColors(f);
  }
});
