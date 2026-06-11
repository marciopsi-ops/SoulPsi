const fs = require('fs');

const fixFile = (path, oldStr, newStr) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.split(oldStr).join(newStr);
  fs.writeFileSync(path, content, 'utf8');
}

fixFile('src/components/LandingPage.tsx', `finalProfile.whatsapp?.replace(/\\D/g, '')`, 'formatWa(finalProfile.whatsapp)');
fixFile('src/components/FloatingActions.tsx', `whatsapp.replace(/\\D/g, '')`, 'formatWa(whatsapp)');
fixFile('src/components/Checkout.tsx', `(bookingData?.therapistWhatsapp || '').replace(/\\D/g, '')`, 'formatWa(bookingData?.therapistWhatsapp || "")');
fixFile('src/components/ServiceDetail.tsx', `window.open(\`https://wa.me/\${whatsapp}?text=\${text}\`, '_blank');`, `window.open(\`https://wa.me/\${formatWa(whatsapp)}?text=\${text}\`, '_blank');`);
fixFile('src/components/Dashboard.tsx', `supportSettings.phone.replace(/[^0-9]/g, '')`, 'formatWa(supportSettings.phone)');
fixFile('src/components/Dashboard.tsx', `55\${notificationModalClient.phone?.replace(/\\D/g, "")}`, `\${formatWa(notificationModalClient.phone)}`);
