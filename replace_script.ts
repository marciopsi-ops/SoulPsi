import * as fs from 'fs';
import * as path from 'path';

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace primary buttons/backgrounds (dark) with Marsala
    content = content.replace(/bg-slate-800/g, 'bg-marsala-600');
    content = content.replace(/bg-slate-900/g, 'bg-marsala-700');
    content = content.replace(/hover:bg-slate-900/g, 'hover:bg-marsala-700');
    content = content.replace(/hover:bg-slate-800/g, 'hover:bg-marsala-600');
    
    // Replace text headings with Marsala? The prompt says "cores mais escuras para detalhes".
    // Let's make text-slate-900 (often headings) Marsala, and text-slate-800 (subheadings) Marrom.
    // Wait, text-slate-900 is also used for inputs. Let's just leave inputs as Marrom (text-slate-900).
    // What about emerald? Let's make it a bit more muted for the "pastel" vibe.

    fs.writeFileSync(filePath, content);
}
console.log('Replaced bg-slate-800/900 with Marsala in components!');
