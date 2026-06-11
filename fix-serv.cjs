const fs = require('fs');
let content = fs.readFileSync('src/components/ServiceDetail.tsx', 'utf8');
content = content.replace(`window.open(\`https://wa.me/\${whatsapp}?text=\${text}\`, '_blank');`, `window.open(\`https://wa.me/\${formatWa(whatsapp)}?text=\${text}\`, '_blank');`);
content = content.replace(`import { X, Calendar, MessageCircle, MapPin } from 'lucide-react';`, `import { X, Calendar, MessageCircle, MapPin } from 'lucide-react';\nimport { formatWa } from '../lib/utils';`);
fs.writeFileSync('src/components/ServiceDetail.tsx', content, 'utf8');
