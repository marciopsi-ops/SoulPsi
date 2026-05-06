const fs = require('fs');

function replaceName(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Soul<span[^>]*>Psi<\/span>/g, '<span className="font-bold text-2xl tracking-tight text-amber-500">ELO</span> <span className="text-slate-600 font-medium text-lg">Soluções Humanas</span>');
    content = content.replace(/"SoulPsi"/g, '"Elo Soluções Humanas"');
    fs.writeFileSync(file, content);
}

replaceName('src/components/CompanyRegistration.tsx');
replaceName('src/components/PatientRegistration.tsx');
replaceName('src/App.tsx');
replaceName('metadata.json');

console.log("Renamed to ELO Soluções Humanas");
