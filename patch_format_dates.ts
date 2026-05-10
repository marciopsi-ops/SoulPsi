import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace format(new Date(...), "dd/MM/yyyy") occurrences to avoid Invalid time value globally across the file
// This is a generic safety patch for React renders
content = content.replace(
  /format\(new Date\(a\.datetime\), "([a-zA-Z0-9\/\s:]+)"\)/g,
  "(!isNaN(new Date(a.datetime).getTime()) ? format(new Date(a.datetime), \"$1\") : a.datetime)"
);

content = content.replace(
  /format\(new Date\(ap\.datetime\), "([a-zA-Z0-9\/\s:]+)"\)/g,
  "(!isNaN(new Date(ap.datetime).getTime()) ? format(new Date(ap.datetime), \"$1\") : ap.datetime)"
);

content = content.replace(
  /format\(new Date\(h\.date\), "([a-zA-Z0-9\/\s:]+)"\)/g,
  "(!isNaN(new Date(h.date).getTime()) ? format(new Date(h.date), \"$1\") : h.date)"
);

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
console.log('Fixed more format dates in Dashboard.tsx');
