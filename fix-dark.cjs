const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

cssContent = cssContent.replace(/@theme \{[\s\S]*\}\n/g, '');

const newTheme = `
@theme {
  --color-gelo: #F8F9F9;
  --color-gelo-dark: #EAEDED;

  --color-concreto-light: #D5D8DC;
  --color-concreto: #ABB2B9;
  --color-concreto-dark: #808B96;

  --color-camurca-light: #BCA89F;
  --color-camurca: #A48C7C;
  --color-camurca-dark: #8C7565;

  --color-marrom-light: #5D4037;
  --color-marrom: #4E342E;
  --color-marrom-dark: #3E2723;

  --color-marsala-light: #B7666A;
  --color-marsala: #9B4B4E;
  --color-marsala-dark: #7C3A3F;
  
  --color-amarelo: #FDB813;
  --color-amarelo-dark: #F39C12;
}
`;
fs.writeFileSync(cssPath, cssContent + newTheme);
console.log("Custom colors added!");
