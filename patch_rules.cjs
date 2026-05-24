const fs = require('fs');

function patchRules(filename) {
  let c = fs.readFileSync(filename, 'utf8');

  if (!c.includes('generalCostsStr')) {
    c = c.replace(/(&& data\.get\('companyCostsStr', '\[\]'\) is string && data\.get\('companyCostsStr', '\[\]'\)\.size\(\) <= 50000)/, "$1\n        && data.get('generalCostsStr', '[]') is string && data.get('generalCostsStr', '[]').size() <= 50000\n        && data.get('generalIncomesStr', '[]') is string && data.get('generalIncomesStr', '[]').size() <= 50000");
  }

  if (!c.includes('publicDomain')) {
    c = c.replace(/(&& data\.get\('tiktokUrl', ''\) is string && data\.get\('tiktokUrl', ''\)\.size\(\) <= 500)/, "$1\n        && data.get('publicDomain', '') is string && data.get('publicDomain', '').size() <= 200");
  }

  const hasOnlyRegex = /(incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(\[[^\]]+\]\))/g;
  let matches;
  while ((matches = hasOnlyRegex.exec(c)) !== null) {
      if (matches[1].includes("'name'") && matches[1].includes("'title'")) {
          // Find the bounds of the array
          let arrayStart = matches[1].indexOf('[');
          let arrayEnd = matches[1].lastIndexOf(']');
          let innerArray = matches[1].substring(arrayStart + 1, arrayEnd);
          
          let keys = innerArray.split(',').map(k => k.trim().replace(/'/g, '').replace(/\n/g, ''));
          keys = keys.filter(k => k.length > 0);
          
          if (!keys.includes('publicDomain')) keys.push('publicDomain');
          if (!keys.includes('generalCostsStr')) keys.push('generalCostsStr');
          if (!keys.includes('generalIncomesStr')) keys.push('generalIncomesStr');
          
          let newArrayStr = keys.map(k => "'" + k + "'").join(', ');
          
          c = c.slice(0, matches.index + arrayStart + 1) + newArrayStr + c.slice(matches.index + arrayEnd);
      }
  }

  fs.writeFileSync(filename, c, 'utf8');
}

patchRules('DRAFT_firestore.rules');
patchRules('firestore.rules');
