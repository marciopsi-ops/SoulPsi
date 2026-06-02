const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
const content = fs.readFileSync(file, 'utf8');

const r = /\{\/\* Dashboard Metrics \*\/\}(.|\n)*\{globalBillingFilter === "pending" && \(\n                    <Check className="w-5 h-5 text-amber-600 absolute top-4 right-4" \/>\n                  \)\}\n                <\/div>\n              <\/div>\n            <\/div>/;
const match = content.match(r);
if(!match) {
  console.log("Could not find the block");
  process.exit(1);
}

const blockToMove = match[0];
let updatedContent = content.replace(blockToMove, '');

const insertionPointStr = `                      } catch {
                        return "0,00";
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>`;

const insertIndex = updatedContent.indexOf(insertionPointStr) + insertionPointStr.length;
if (insertIndex === -1 + insertionPointStr.length) {
  console.log("Could not find insertion point");
  process.exit(1);
}

updatedContent = updatedContent.slice(0, insertIndex) + '\n\n' + blockToMove + updatedContent.slice(insertIndex);
fs.writeFileSync(file, updatedContent, 'utf8');
console.log("Success");
