import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add imports
if (!content.includes('ArrowUp')) {
  content = content.replace(
    "} from 'lucide-react';",
    ", ArrowUp, ArrowDown } from 'lucide-react';"
  );
}

// Add the buttons
content = content.replace(
  /<button type="button" onClick=\{\(\) => \{\n\s*const newSvc = \(editForm\.services \|\| \[\]\)\.filter\(\(_: any, i: number\) => i !== idx\);\n\s*setEditForm\(\{\.\.\.editForm, services: newSvc\}\);\n\s*\}\} className="absolute top-4 right-4 text-slate-400 hover:text-red-600 transition">\n\s*<Trash2 className="w-4 h-4" \/>\n\s*<\/button>/g,
  `$&
                       <div className="absolute top-4 right-12 flex items-center gap-2">
                         <button type="button" onClick={() => {
                             if (idx === 0) return;
                             const arr = [...editForm.services];
                             // @ts-ignore
                             [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                             setEditForm({...editForm, services: arr});
                         }} disabled={idx === 0} className="text-slate-400 hover:text-amber-500 disabled:opacity-30 transition" title="Mover para cima">
                           <ArrowUp className="w-4 h-4" />
                         </button>
                         <button type="button" onClick={() => {
                             if (idx === editForm.services.length - 1) return;
                             const arr = [...editForm.services];
                             // @ts-ignore
                             [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                             setEditForm({...editForm, services: arr});
                         }} disabled={idx === editForm.services.length - 1} className="text-slate-400 hover:text-amber-500 disabled:opacity-30 transition" title="Mover para baixo">
                           <ArrowDown className="w-4 h-4" />
                         </button>
                       </div>`
);

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');

console.log('done running script');
