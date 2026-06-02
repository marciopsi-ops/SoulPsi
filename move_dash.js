const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
const content = fs.readFileSync(file, 'utf8');

// Find the block to move
const startBlock = "            {/* Dashboard Metrics */}";
const endBlockInfo = `                  {globalBillingFilter === "pending" && (
                    <Check className="w-5 h-5 text-amber-600 absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </div>`;

const startIndex = content.indexOf(startBlock);
const blockEndEndStr = "</div>\n              </div>\n            </div>";
// Wait, I will use regular expressions to find the exact block reliably.

const r = /\{\/\* Dashboard Metrics \*\/\}(.|\n)*\{globalBillingFilter === "pending" && \(\n                    <Check className="w-5 h-5 text-amber-600 absolute top-4 right-4" \/>\n                  \)\}\n                <\/div>\n              <\/div>\n            <\/div>/;
const match = content.match(r);
if(!match) {
  console.log("Could not find the block");
  process.exit(1);
}

const blockToMove = match[0];

let updatedContent = content.replace(blockToMove, '');

// Now we need to insert it inside `visao_geral` right after `Dashboard Geral de Faturamento` grid element finishes.
// Look for the end of `bg-red-50 border border-red-100 rounded-xl p-5`
const insertionPointStr = `                      } catch {
                        return "0,00";
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>`;

const insertIndex = updatedContent.indexOf(insertionPointStr) + insertionPointStr.length;

if (updatedContent.indexOf(insertionPointStr) === -1) {
  console.log("Could not find insertion point");
  process.exit(1);
}

updatedContent = updatedContent.slice(0, insertIndex) + '\n\n' + blockToMove + updatedContent.slice(insertIndex);

fs.writeFileSync(file, updatedContent, 'utf8');
console.log("Successfully moved the dashboard charts to Visao Geral");
