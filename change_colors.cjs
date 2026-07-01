const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const themeInjection = `
@theme {
  /* Gelo / Concreto / Camurça / Marrom / Marsala mapped to slate */
  --color-slate-50: #F8F9FA; /* Gelo */
  --color-slate-100: #F0F2F1; /* Gelo/Camurça soft */
  --color-slate-200: #E0E4E5; /* Concreto claro */
  --color-slate-300: #C4CBCC; /* Concreto */
  --color-slate-400: #BCA89F; /* Camurça clara */
  --color-slate-500: #A48C7C; /* Camurça */
  --color-slate-600: #755F51; /* Marrom claro (texto secundário) */
  --color-slate-700: #4E342E; /* Marrom (texto primário) */
  --color-slate-800: #9B4B4E; /* Marsala (títulos, botões) */
  --color-slate-900: #7C3A3F; /* Marsala escuro (hover botões) */

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

  /* Adjust emerald to a softer mint/green to match the pastel mental health vibe */
  --color-emerald-50: #F1F8E9;
  --color-emerald-100: #DCEDC8;
  --color-emerald-500: #8BC34A;
  --color-emerald-600: #689F38;
  --color-emerald-700: #558B2F;
}
`;

if (!cssContent.includes('@theme')) {
  cssContent += themeInjection;
  fs.writeFileSync(cssPath, cssContent);
  console.log("Colors injected!");
} else {
  console.log("Theme already present.");
}
