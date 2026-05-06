const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// The operations are roughly in the activeTab === 'empresas' section
// Let's first isolate the section for companies, but we don't necessarily have to. We can just replace exact known strings in that section.
// However, the safest way is a sequence of targeted replaces within the 'empresas' render map.

// 1. "Editar Pessoal" -> "Editar"
content = content.replace(/<User className="w-4 h-4"\/> Editar Pessoal/g, (match, offset) => {
    // We only want to replace it for companies. Let's replace the second occurrence or all occurrences? User said "na área de empresas".
    return offset > 1800 ? '<User className="w-4 h-4"/> Editar' : match;
});

// 2. "Esconder Sessões" -> "Esconder Serviços", and 'Ver Histórico / Prontuário' could be left as is or updated to general.
content = content.replace(/Esconder Sessões/g, (match, offset) => {
    return offset > 1800 ? 'Esconder Serviços' : match;
});

// 3. "Histórico de Sessões e Financeiro" -> "Histórico de Serviços e Financeiro"
content = content.replace(/Histórico de Sessões e Financeiro/g, (match, offset) => {
    return offset > 1800 ? 'Histórico de Serviços e Financeiro' : match;
});

// 4. "Nova Sessão" -> "Novo Serviço"
content = content.replace(/Nova Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Novo Serviço' : match;
});

// 5. "Registrar Nova Sessão" -> "Registrar Novo Serviço"
content = content.replace(/Registrar Nova Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Registrar Novo Serviço' : match;
});

// 6. "Anotações da Sessão" -> "Anotações do Serviço"
content = content.replace(/Anotações da Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Anotações do Serviço' : match;
});

// 7. "Salvar Sessão" -> "Salvar Serviço"
content = content.replace(/Salvar Sessão/g, (match, offset) => {
    return offset > 1800 ? 'Salvar Serviço' : match;
});

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Basic text replacements done");
