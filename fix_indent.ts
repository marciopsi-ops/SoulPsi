import fs from 'fs';

const files = ['src/components/Dashboard.tsx', 'src/components/LandingPage.tsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Simplest way: replace any consecutive occurrences of the new options
    content = content.replace(/\n<option value="Institui/g, '\n                                   <option value="Institui');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
