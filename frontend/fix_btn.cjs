
const fs = require('fs');
let content = fs.readFileSync('C:/Alchex/frontend/src/pages/LandingPage.tsx', 'utf8');

// Fix ' -[var(--bg)] '
content = content.replace(/ \-\[var\(--bg\)\]/g, ' bg-[var(--accent)] text-[var(--bg)]');
fs.writeFileSync('C:/Alchex/frontend/src/pages/LandingPage.tsx', content);

// Also let's just make sure LoginPage.tsx button is correct
let bContent = fs.readFileSync('C:/Alchex/frontend/src/pages/LoginPage.tsx', 'utf8');
bContent = bContent.replace(/ \-\[var\(--bg\)\]/g, ' bg-[var(--accent)] text-[var(--bg)]');
fs.writeFileSync('C:/Alchex/frontend/src/pages/LoginPage.tsx', bContent);

let sContent = fs.readFileSync('C:/Alchex/frontend/src/pages/SignupPage.tsx', 'utf8');
sContent = sContent.replace(/ \-\[var\(--bg\)\]/g, ' bg-[var(--accent)] text-[var(--bg)]');
fs.writeFileSync('C:/Alchex/frontend/src/pages/SignupPage.tsx', sContent);


