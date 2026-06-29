const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetRegex = /try \{\s*const provider = new GoogleAuthProvider\(\);\s*provider\.addScope\("https:\/\/www\.googleapis\.com\/auth\/drive\.file"\);\s*const result = await signInWithPopup\(auth, provider\);\s*const credential = GoogleAuthProvider\.credentialFromResult\(result\);\s*if \(credential\?\.accessToken\) \{\s*driveToken = credential\.accessToken;\s*useFirebaseFallback = false;\s*\}\s*\} catch \(authError: any\) \{\s*if \(authError\.code === "auth\/popup-blocked"\) \{\s*alert\("Popup do Google Drive bloqueado pelo navegador\. O arquivo será salvo no sistema local\."\);\s*\} else if \(\s*authError\.code !== "auth\/popup-closed-by-user" &&\s*authError\.code !== "auth\/cancelled-popup-request" &&\s*authError\.message !== "Login process cancelled by user\."\s*\) \{\s*console\.error\("Erro auth Drive:", authError\);\s*alert\("Não foi possível autenticar no Drive\. Salvando no sistema local\."\);\s*\} else \{\s*throw new Error\("Login process cancelled by user\."\);\s*\}\s*\}/g;

const replacement = `try {
          driveToken = await getDriveToken();
          if (driveToken) {
            useFirebaseFallback = false;
          }
        } catch (authError: any) {
          console.error("Erro auth Drive:", authError);
          alert("Sua sessão do Google Drive expirou ou falhou. O arquivo será salvo no sistema local. Por favor, reconecte o Drive na aba Perfil.");
        }`;

content = content.replace(targetRegex, replacement);

const exportDriveRegex = /const provider = new GoogleAuthProvider\(\);\s*provider\.addScope\("https:\/\/www\.googleapis\.com\/auth\/drive\.file"\);\s*const result = await signInWithPopup\(auth, provider\);\s*const credential = GoogleAuthProvider\.credentialFromResult\(result\);\s*const token = credential\?\.accessToken;/g;

const exportDriveReplacement = `const token = await getDriveToken();`;

content = content.replace(exportDriveRegex, exportDriveReplacement);

fs.writeFileSync('src/components/Dashboard.tsx', content);
