const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/<User className="w-4 h-4"\/> Editar Pessoal/g, (match, offset) => {
    return offset > 1800 ? '<User className="w-4 h-4"/> Editar' : match;
});

content = content.replace(/Esconder Sessões/g, (match, offset) => {
    return offset > 1800 ? 'Esconder Serviços' : match;
});

content = content.replace(/Histórico de Sessões e Financeiro/g, (match, offset) => {
    return offset > 1800 ? 'Histórico de Serviços e Financeiro' : match;
});

content = content.replace(/Nova Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Novo Serviço' : match;
});

content = content.replace(/Registrar Nova Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Registrar Novo Serviço' : match;
});

content = content.replace(/Anotações da Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Anotações do Serviço' : match;
});

content = content.replace(/Salvar Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Salvar Serviço' : match;
});

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Basic text replacements done");
