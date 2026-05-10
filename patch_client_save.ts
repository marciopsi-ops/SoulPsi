import fs from 'fs';

const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const payload: any = \{\n\s+name: clientEditForm\.name,\n\s+dob: clientEditForm\.dob,\n\s+cpf: clientEditForm\.cpf,\n\s+email: clientEditForm\.email,\n\s+phone: clientEditForm\.phone,\n\s+isActive: clientEditForm\.isActive,\n\s+notes: clientEditForm\.notes \|\| '',\n\s+source: clientEditForm\.source \|\| 'Outros'\n\s+\};/,
  `const payload: any = {
         name: clientEditForm.name || '',
         dob: clientEditForm.dob || '',
         cpf: clientEditForm.cpf || '',
         email: clientEditForm.email || '',
         phone: clientEditForm.phone || '',
         isActive: clientEditForm.isActive !== false,
         notes: clientEditForm.notes || '',
         source: clientEditForm.source || 'Outros'
      };`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed handleClientSave');
