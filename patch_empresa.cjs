const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /{activeTab === 'pacientes' && \([\s\S]*?(?={activeTab === 'avaliacoes' && \()/;
const match = content.match(regex);

if (match) {
    let empresaContent = match[0];
    empresaContent = empresaContent.replace(/activeTab === 'pacientes'/g, "activeTab === 'empresas'");
    
    // Rename references
    const replacements = [
        ['clientSearchText', 'companySearchText'],
        ['setClientSearchText', 'setCompanySearchText'],
        ['clientSourceFilter', 'companySourceFilter'],
        ['setClientSourceFilter', 'setCompanySourceFilter'],
        ['filteredClients', 'filteredCompanies'],
        ['filteredClientAppts', 'filteredCompanyAppts'],
        ['clients', 'companies'],
        ['clientEditForm', 'companyEditForm'],
        ['setClientEditForm', 'setCompanyEditForm'],
        ['handleClientSave', 'handleCompanySave'],
        ['clientId', 'companyId'],
        ['setEditingClientId', 'setEditingCompanyId'],
        ['editingClientId', 'editingCompanyId'],
        ['expandedClientId', 'expandedCompanyId'],
        ['setExpandedClientId', 'setExpandedCompanyId'],
        ['handleAddSession', 'handleAddCompanySession'],
        ['handleEditSession', 'handleEditCompanySession'],
        ['appointmentEditForm', 'companyAppointmentEditForm'],
        ['setAppointmentEditForm', 'setCompanyAppointmentEditForm'],
        ['editingAppointmentId', 'editingCompanyAppointmentId'],
        ['setEditingAppointmentId', 'setEditingCompanyAppointmentId'],
        ['handleAppointmentSave', 'handleCompanyAppointmentSave'],
        ['handleAppointmentDelete', 'handleCompanyAppointmentDelete'],
        ['handleFileUpload', 'handleCompanyFileUpload'],
        ['clientAppts', 'companyAppts'],
        ['appointments', 'companyAppointments'],
        ['client\\.', 'company.'],
        ['client.id', 'company.id'],
        ['client.name', 'company.name'],
        ['client.email', 'company.email'],
        ['client.phone', 'company.phone'],
        ['client.source', 'company.source'],
        ['client.notes', 'company.notes'],
        ['handleClientEdit', 'handleCompanyEdit'],
        ['Prontuário e Agendamentos', 'Gestão de Empresas'],
        ['Adicionar Paciente', 'Adicionar Empresa'],
        ['Novo Paciente', 'Nova Empresa'],
        ['Paciente ', 'Empresa '],
        ['paciente ', 'empresa '],
        ['Pacientes', 'Empresas'],
        ['pacientes', 'empresas'],
        ['CPF:', 'CNPJ:'],
        ['Nasc:', 'Contato:'],
        ['Data de Nascimento', 'Pessoa de Contato'],
        ['dob', 'contactPerson'],
        ['cpf', 'cnpj']
    ];

    let output = empresaContent;
    let lines = output.split('\n');
    lines = lines.map(line => {
        let l = line;
        for (let [from, to] of replacements) {
            l = l.split(from).join(to);
        }
        // Special manual replacements
        l = l.split('client ').join('company ');
        l = l.split('client}').join('company}');
        l = l.split('client:').join('company:');
        l = l.split('client=').join('company=');
        
        return l;
    });
    output = lines.join('\n');
    
    const index = content.indexOf("{activeTab === 'avaliacoes' && (");
    if (index !== -1) {
        const newContent = content.substring(0, index) + output + "\n        " + content.substring(index);
        fs.writeFileSync('src/components/Dashboard.tsx', newContent);
        console.log('patched');
    }
}
