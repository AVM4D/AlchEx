const fs = require('fs');
let c = fs.readFileSync('C:/Alchex/frontend/src/pages/LandingPage.tsx', 'utf8');
c = c.replace(/<div className="hero-logo mb-6 flex justify-center opacity-0">\s*<span className="font-logo text-\[15vw\] lg:text-\[20vw\] leading-none font-bold tracking-wider text-\[var\(--text\)\]">ALCHEX<\/span>/g, '<div className="hero-logo mb-6 flex justify-center opacity-0">\n              <span className="font-logo text-[15vw] lg:text-[20vw] leading-none font-bold tracking-wider text-[var(--text)]">ALCHEX</span>\n            </div>');
fs.writeFileSync('C:/Alchex/frontend/src/pages/LandingPage.tsx', c);
