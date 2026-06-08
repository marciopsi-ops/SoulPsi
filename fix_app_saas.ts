import * as fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Check for product URL param
content = content.replace("    const paramRegisterCompanyId = urlParams.get('register_c');", 
`    const paramRegisterCompanyId = urlParams.get('register_c');
    const paramSaas = urlParams.get('saas') === 'true' || urlParams.get('produto') === 'true';

    if (paramSaas) {
       setView('saas');
       setLoading(false);
       return;
    }`);

// 2. Add the view renderer
content = content.replace("{view === 'admin' && (", 
`{view === 'saas' && (
          <SaasProductLaunch onLogin={() => setAuthModalOpen(true)} />
        )}
        {view === 'admin' && (`);

// 3. FloatingActions don't need to show on SaaS page
// The array already excludes 'saas', so `['landing', 'service_detail', ...].includes(view)` won't show it.

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
