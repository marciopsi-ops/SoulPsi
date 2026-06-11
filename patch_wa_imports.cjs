const fs = require('fs');

function addFormatWa(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('formatWa')) {
    // If it imports from lib/utils, add to it
    if (content.includes('from "../lib/utils"') || content.includes("from '../lib/utils'")) {
      content = content.replace(/import \{([^}]+)\} from "(\.\.\/lib\/utils)"/, "import {$1, formatWa} from \"$2\"");
      content = content.replace(/import \{([^}]+)\} from '(\.\.\/lib\/utils)'/, "import {$1, formatWa} from '$2'");
    } else {
      content = 'import { formatWa } from "../lib/utils";\n' + content;
    }
  } else {
    if (!content.includes("formatWa} from") && !content.includes("formatWa } from")) {
      content = 'import { formatWa } from "../lib/utils";\n' + content;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

addFormatWa('src/components/Checkout.tsx');
addFormatWa('src/components/ServiceDetail.tsx');
