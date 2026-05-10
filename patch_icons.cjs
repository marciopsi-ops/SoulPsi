const fs = require('fs');
let file = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

file = file.replace(/import \{ User, Calendar as CalendarIcon, MessageSquare/, 'import { Loader2, CheckCircle2, User, Calendar as CalendarIcon, MessageSquare');

fs.writeFileSync('src/components/Dashboard.tsx', file, 'utf8');
