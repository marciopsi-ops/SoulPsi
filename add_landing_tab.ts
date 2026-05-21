import fs from 'fs';

let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Import Church icon
content = content.replace(
  "LinkIcon, Phone, Mail, ArrowLeftRight }",
  "LinkIcon, Phone, Mail, ArrowLeftRight, Church }"
);


// 2. Add Tab
let tabToInsert = `
        <button 
          onClick={() => setActiveTab('igrejas')}
          className={cn("px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2", activeTab === 'igrejas' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          <div className="flex items-center gap-1.5 sm:gap-2"><Church className="w-4 h-4"/> Para Igrejas</div>
        </button>`;

content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('psicologos'\)\}[\s\S]*?<\/button>/,
  tabToInsert + "\n$&"
);

// 3. Add Content Area
// Wait, I need to see where `activeTab === 'empresa'` is handled to add the `igrejas` logic.
fs.writeFileSync('src/components/LandingPage.tsx', content, 'utf8');
