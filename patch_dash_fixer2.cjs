const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// I will just use a simple regex to replace `{formatMoneyUI( X.toFixed(2).replace(".", "," )}` and similar.
// Basically, we shouldn't have `toFixed(2)` inside `formatMoneyUI` anyway.
content = content.replace(/\.toFixed\(2\)\s*\.replace\("\.", ","\s*/gm, "");
// And also `\.toFixed\(2\)\s*\.replace\('\.', ','\s*` just in case
content = content.replace(/\.toFixed\(2\)\s*\.replace\('\.', ','\s*/gm, "");

// Wait, the above will strip it, but it might leave `)` incorrectly or something.
// Let's see what happens to `formatMoneyUI( appointments... .replace(".", "," )}` -> `formatMoneyUI( appointments... )}`
// That is syntactically correct!
// Let's double check.

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
