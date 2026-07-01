const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

cssContent = cssContent.replace(/@theme \{[\s\S]*\}\n/g, '');
cssContent = cssContent.replace(/@theme \{[\s\S]*\}/g, '');

const newTheme = `
@theme {
  /* Gelo / Concreto / Camurça / Marrom mapped to standard Tailwind slate colors */
  /* This ensures all generic layouts automatically inherit the Saúde Mental palette */
  --color-slate-50: #F8F9FA; /* Gelo */
  --color-slate-100: #F0F2F2; /* Gelo suave */
  --color-slate-200: #E2E6E7; /* Concreto ultra claro (bordas suaves) */
  --color-slate-300: #D5D8DC; /* Concreto claro (bordas) */
  --color-slate-400: #BCA89F; /* Camurça clara */
  --color-slate-500: #A48C7C; /* Camurça (ícones, subtextos) */
  --color-slate-600: #755F51; /* Marrom claro (texto descritivo) */
  --color-slate-700: #4E342E; /* Marrom (texto base) */
  --color-slate-800: #3E2723; /* Marrom escuro (títulos secundários) */
  --color-slate-900: #261612; /* Marrom ultra escuro (títulos primários) */

  /* Amarelo Quente (ELO Soluções Humanas) mapped to amber */
  --color-amber-50: #FFF9E6;
  --color-amber-100: #FFECB3;
  --color-amber-200: #FFE082;
  --color-amber-300: #FFD54F;
  --color-amber-400: #FFCA28;
  --color-amber-500: #FDB813; /* Amarelo quente ELO */
  --color-amber-600: #F39C12;
  --color-amber-700: #D68910;
  --color-amber-800: #BA4A00;
  --color-amber-900: #873600;

  /* Marsala (Acentos, botões, detalhes ricos) */
  --color-marsala-50: #F9F1F2;
  --color-marsala-100: #F3E0E2;
  --color-marsala-200: #E6C2C5;
  --color-marsala-300: #D8A4A7;
  --color-marsala-400: #CA858A;
  --color-marsala-500: #B7666A;
  --color-marsala-600: #9B4B4E; /* Marsala base */
  --color-marsala-700: #7C3A3F; /* Marsala hover */
  --color-marsala-800: #622C31;
  --color-marsala-900: #491F24;

  /* Adjust emerald to a softer mint/green (Verde menta suave) to match the pastel mental health vibe */
  --color-emerald-50: #F1F8E9;
  --color-emerald-100: #DCEDC8;
  --color-emerald-200: #C5E1A5;
  --color-emerald-300: #AED581;
  --color-emerald-400: #9CCC65;
  --color-emerald-500: #8BC34A; /* Verde menta */
  --color-emerald-600: #7CB342;
  --color-emerald-700: #689F38;
  --color-emerald-800: #558B2F;
  --color-emerald-900: #33691E;

  /* Azul bebê para detalhes, se necessário mapeamos o blue padrão */
  --color-blue-50: #E3F2FD;
  --color-blue-100: #BBDEFB;
  --color-blue-200: #90CAF9;
  --color-blue-300: #64B5F6;
  --color-blue-400: #42A5F5;
  --color-blue-500: #2196F3;
  --color-blue-600: #1E88E5;
}
`;
fs.writeFileSync(cssPath, cssContent + newTheme);
console.log("Custom colors added cleanly!");
