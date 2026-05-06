const fs = require('fs');

const files = [
    'src/App.tsx',
    'src/components/AdminDashboard.tsx',
    'src/components/Checkout.tsx',
    'src/components/CompanyRegistration.tsx',
    'src/components/Dashboard.tsx',
    'src/components/LandingPage.tsx',
    'src/components/PatientRegistration.tsx',
    'src/components/PublicProfile.tsx'
];

const replaces = {
    'bg-blue-600': 'bg-amber-500',
    'hover:bg-blue-700': 'hover:bg-amber-600',
    'text-blue-600': 'text-amber-500',
    'text-blue-700': 'text-amber-600',
    'text-blue-800': 'text-amber-700',
    'text-blue-900': 'text-amber-800',
    'text-blue-500': 'text-amber-500',
    'ring-blue-500': 'ring-amber-400',
    'border-blue-500': 'border-amber-400',
    'border-blue-400': 'border-amber-400',
    'border-blue-200': 'border-amber-200',
    'border-blue-100': 'border-amber-100',
    'bg-blue-50': 'bg-amber-50',
    'bg-blue-100': 'bg-amber-100',
    'from-blue-600': 'from-amber-500',
    'to-blue-500': 'to-amber-400',
    'to-indigo-700': 'to-amber-600',
    'from-emerald-400': 'from-yellow-400'
};

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    for (const [key, value] of Object.entries(replaces)) {
        // use regex globally
        const re = new RegExp(key, 'g');
        content = content.replace(re, value);
    }
    fs.writeFileSync(file, content);
}

console.log("Colors updated.");
