const fs = require('fs');
const path = require('path');

const componentsDir = path.join(process.cwd(), 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace primary buttons/backgrounds (dark) with Marsala
    content = content.replace(/bg-slate-800/g, 'bg-marsala-700');
    content = content.replace(/bg-slate-900/g, 'bg-marsala-800');
    content = content.replace(/hover:bg-slate-900/g, 'hover:bg-marsala-800');
    content = content.replace(/hover:bg-slate-800/g, 'hover:bg-marsala-700');
    
    // For text-slate-800 (used heavily), maybe replace it with marsala in some cases? 
    // Actually, keeping them as slate-800 (which will map to Marrom Escuro) is perfect.
    // dark mode classes: dark:bg-slate-800 -> if it becomes marsala, dark mode is red. 
    // We should fix dark mode classes back to slate!
    content = content.replace(/dark:bg-marsala-700/g, 'dark:bg-slate-800');
    content = content.replace(/dark:bg-marsala-800/g, 'dark:bg-slate-900');
    content = content.replace(/dark:hover:bg-marsala-700/g, 'dark:hover:bg-slate-800');
    content = content.replace(/dark:hover:bg-marsala-800/g, 'dark:hover:bg-slate-900');

    fs.writeFileSync(filePath, content);
}
console.log('Replaced bg-slate-800/900 with Marsala in components!');
