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
          let innerArray = matches[1].substring(matches[1].indexOf('[') + 1, matches[1].lastIndexOf(']'));
          let keys = innerArray.split(',').map(k => k.trim().replace(/'/g, ''));
          
          if (!keys.includes('publicDomain')) keys.push('publicDomain');
          if (!keys.includes('generalCostsStr')) keys.push('generalCostsStr');
          if (!keys.includes('generalIncomesStr')) keys.push('generalIncomesStr');
          
          let newArrayStr = keys.map(k => "'" + k + "'").join(',\n                          ');
          let newStr = "incoming().diff(existing()).affectedKeys().hasOnly([\n                          " + newArrayStr + "\n                        ])";
          
          c = c.replace(matches[1], newStr);
      }
  }

  fs.writeFileSync(filename, c, 'utf8');
}

patchRules('DRAFT_firestore.rules');
patchRules('firestore.rules');
