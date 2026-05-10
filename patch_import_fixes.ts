import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Fix client.dob formatting in rendering
content = content.replace(
  /client\.dob \? format\(new Date\(client\.dob\)\.getTime\(\) \+ new Date\(client\.dob\)\.getTimezoneOffset\(\) \* 60000, "dd\/MM\/yyyy"\) : '-'/g,
  "client.dob ? (!isNaN(new Date(client.dob).getTime()) ? format(new Date(client.dob).getTime() + new Date(client.dob).getTimezoneOffset() * 60000, 'dd/MM/yyyy') : client.dob) : '-'"
);

// 2. Fix handleImportCSV clientPayload formatting and constraints
const oldPayloadStr = `const clientPayload: any = {
           name: cols[0]?.trim() || '',
           email: cols[1]?.trim() || '',
           phone: cols[2]?.trim() || '',
           cpf: cols[3]?.trim() || '',
           dob: cols[4]?.trim() || '',
           frequency: cols[5]?.trim() || 'Avulso',
           source: cols[6]?.trim() || 'Outros',
           isActive: cols[7]?.trim() !== 'Inativo',
           notes: cols[8]?.trim() || '',
           lgpdAccepted: true,
           rulesAccepted: false,
        };`;

const newPayloadStr = `let parsedDob = cols[4]?.trim() || '';
        const dobMatch = parsedDob.match(/^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/);
        if (dobMatch) {
            parsedDob = \`\${dobMatch[3]}-\${dobMatch[2]}-\${dobMatch[1]}\`;
        }
        
        const clientPayload: any = {
           name: (cols[0]?.trim() || '').substring(0, 100),
           email: (cols[1]?.trim() || '').substring(0, 100),
           phone: (cols[2]?.trim() || '').substring(0, 20),
           cpf: (cols[3]?.trim() || '').substring(0, 20),
           dob: parsedDob.substring(0, 20),
           frequency: (cols[5]?.trim() || 'Avulso').substring(0, 50),
           source: (cols[6]?.trim() || 'Outros').substring(0, 150),
           isActive: cols[7]?.trim() !== 'Inativo',
           notes: (cols[8]?.trim() || '').substring(0, 5000),
           lgpdAccepted: true,
           rulesAccepted: false,
        };`;

content = content.replace(oldPayloadStr, newPayloadStr);

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
console.log('Fixed export fixes in Dashboard.tsx');
