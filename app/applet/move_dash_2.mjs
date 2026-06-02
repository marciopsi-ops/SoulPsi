import fs from 'fs';
const file = 'src/components/Dashboard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const START_MATCH = "            {/* Dashboard Metrics */}";
const END_MATCH = "                  Exibindo apenas pacientes com faturamento{\" \"}";

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(START_MATCH)) {
    startIdx = i;
    break;
  }
}

for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes(END_MATCH)) {
    // Then there are 3 more lines for the paragraph ending, and then a div
    // 5275: ...
    // 5279: </p>
    // 5280: )}
    // 5281: </div>
    endIdx = i + 8; // Adjusting visually
    break;
  }
}

console.log("Start:", startIdx, "End:", endIdx);

if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
  console.log("Error finding indices");
  process.exit(1);
}

// Slice out the block
const blockToMove = lines.slice(startIdx, endIdx + 1);
lines.splice(startIdx, endIdx - startIdx + 1);

// Find insert index. The end of Faturamento inside visao_geral:
// 3099:                         return (c1 + c2 + c3)
// 3100:                           .toFixed(2)
// 3101:                           .replace(".", ",");
// ...
// 3108:               </div>
// 3109:             </div>
const TARGET_MATCH = "            {/* Quadro com os totais gerais por Conta / local de faturamento */}";

let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(TARGET_MATCH)) {
    insertIdx = i;
    break;
  }
}

if (insertIdx === -1) {
  console.log("Error finding insertion point");
  process.exit(1);
}

lines.splice(insertIdx, 0, ...blockToMove);

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("Done");
