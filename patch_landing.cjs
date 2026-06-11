const fs = require('fs');

let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// 1. Add hook and logical checks after finalProfile declaration
const declarations = `
  const finalProfile = profileData || dummyProfile;

  const hasVoce = finalProfile.services?.some((s: any) => s.category === 'voce') ?? false;
  const hasEmpresa = finalProfile.services?.some((s: any) => s.category === 'empresa') ?? false;
  const hasPsicologos = finalProfile.services?.some((s: any) => s.category === 'psicologos' || s.category === 'psicologo') ?? false;
  const hasIgrejas = finalProfile.services?.some((s: any) => s.category === 'igrejas') ?? false;

  useEffect(() => {
    if (!hasVoce && activeTab === 'voce') {
      if (hasEmpresa) setActiveTab('empresa');
      else if (hasIgrejas) setActiveTab('igrejas');
      else if (hasPsicologos) setActiveTab('psicologos');
    }
  }, [hasVoce, hasEmpresa, hasIgrejas, hasPsicologos, activeTab]);
`;

content = content.replace("  const finalProfile = profileData || dummyProfile;", declarations);

// 2. Hide tabs 
content = content.replace(
  `        <button \n          onClick={() => setActiveTab('voce')}`,
  `        {hasVoce && (<button \n          onClick={() => setActiveTab('voce')}`
);
content = content.replace(
  `          <div className="flex items-center gap-1.5 sm:gap-2"><Calendar className="w-4 h-4"/> Para Você</div>\n        </button>`,
  `          <div className="flex items-center gap-1.5 sm:gap-2"><Calendar className="w-4 h-4"/> Para Você</div>\n        </button>)}`
);

content = content.replace(
  `        <button \n          onClick={() => setActiveTab('empresa')}`,
  `        {hasEmpresa && (<button \n          onClick={() => setActiveTab('empresa')}`
);
content = content.replace(
  `          <div className="flex items-center gap-1.5 sm:gap-2"><Building className="w-4 h-4"/> Para sua Empresa</div>\n        </button>`,
  `          <div className="flex items-center gap-1.5 sm:gap-2"><Building className="w-4 h-4"/> Para sua Empresa</div>\n        </button>)}`
);

content = content.replace(
  `        <button \n          onClick={() => setActiveTab('psicologos')}`,
  `        {hasPsicologos && (<button \n          onClick={() => setActiveTab('psicologos')}`
);
content = content.replace(
  `          <div className="flex items-center gap-1.5 sm:gap-2"><GraduationCap className="w-4 h-4"/> Para Psicólogos</div>\n        </button>`,
  `          <div className="flex items-center gap-1.5 sm:gap-2"><GraduationCap className="w-4 h-4"/> Para Psicólogos</div>\n        </button>)}`
);

// 3. Conditional columns in footer
content = content.replace(
  `              {/* Coluna 1: Para Você */}\n              <div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para Você</h4>`,
  `              {/* Coluna 1: Para Você */}\n              {hasVoce && (<div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para Você</h4>`
);
content = content.replace(
  `              </div>\n\n              {/* Coluna 2: Para a Empresa */}`,
  `              </div>)}\n\n              {/* Coluna 2: Para a Empresa */}`
);

content = content.replace(
  `              {/* Coluna 2: Para a Empresa */}\n              <div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para sua Empresa</h4>`,
  `              {/* Coluna 2: Para a Empresa */}\n              {hasEmpresa && (<div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para sua Empresa</h4>`
);
content = content.replace(
  `              </div>\n\n              {/* Coluna 3: Para Psicólogos */}`,
  `              </div>)}\n\n              {/* Coluna 3: Para Psicólogos */}`
);

content = content.replace(
  `              {/* Coluna 3: Para Psicólogos */}\n              <div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para Psicólogos</h4>`,
  `              {/* Coluna 3: Para Psicólogos */}\n              {hasPsicologos && (<div>\n                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">Para Psicólogos</h4>`
);
content = content.replace(
  `              </div>\n              {/* Coluna 4: Para Igrejas */}`,
  `              </div>)}\n              {/* Coluna 4: Para Igrejas */}`
);

fs.writeFileSync('src/components/LandingPage.tsx', content, 'utf8');
