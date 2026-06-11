const fs = require('fs');

const fixFile = (path, oldStr, newStr) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(path, content, 'utf8');
}

fixFile('src/components/LandingPage.tsx', `import { cn } from '../lib/utils';`, `import { cn, formatWa } from '../lib/utils';`);
fixFile('src/components/Dashboard.tsx', `import { cn } from "../lib/utils";`, `import { cn, formatWa } from "../lib/utils";`);
fixFile('src/components/FloatingActions.tsx', `import { Share2, Check, MessageCircle } from 'lucide-react';`, `import { Share2, Check, MessageCircle } from 'lucide-react';\nimport { formatWa } from '../lib/utils';`);
fixFile('src/components/Checkout.tsx', `import { LogIn, UserPlus } from 'lucide-react';`, `import { LogIn, UserPlus } from 'lucide-react';\nimport { formatWa } from '../lib/utils';`);
fixFile('src/components/LandingPage.tsx', `import { cn } from "../lib/utils";`, `import { cn, formatWa } from "../lib/utils";`); // fallback line

