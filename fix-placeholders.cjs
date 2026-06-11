const fs = require('fs');

function fixColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // replace "dark:bg-slate-800" without "dark:placeholder" 
  // actually, let's just globally replace "dark:text-slate-100 dark:bg-slate-800" 
  // with "dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
  let newContent = content.replace(/dark:text-slate-100 dark:bg-slate-800/g, 'dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800');
  
  // also fix some inputs in LandingPage.tsx if there are any dark/light mode issues. Wait, from the prompt history LandingPage handles the view.
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['src/components/Dashboard.tsx', 'src/components/LandingPage.tsx'].forEach(f => {
  if (fs.existsSync(f)) {
    fixColors(f);
  }
});
