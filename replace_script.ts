import fs from 'fs';

const files = ['src/components/Dashboard.tsx', 'src/components/LandingPage.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<option value="Indicação de profissional">Indicação de profissional<\/option>/g, 
        '<option value="Indicação de profissional">Indicação de profissional</option>\n                                  <option value="Projetos">Projetos</option>\n                                  <option value="Plataformas">Plataformas</option>');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
