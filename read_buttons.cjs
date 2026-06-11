const fs = require('fs');
const content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regexes = [
  /\{finalProfile\.services(?:\[0\])?\?\.\w+.*category === "voce"[\s\S]*?(?:<\/div>\s*<\/div>\s*<\/div>|<\/div>\s*\)\)}?\s*<\/(?:div|React\.Fragment)>)/,
  /\{finalProfile\.services(?:\[0\])?\?\.\w+.*category === "empresa"[\s\S]*?(?:<\/div>\s*<\/div>\s*<\/div>|<\/div>\s*\)\)}?\s*<\/(?:div|React\.Fragment)>)/,
];
// Just reading how the blocks look to make a regex replacement script.
