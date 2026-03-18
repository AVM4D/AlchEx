const fs = require('fs');
let c = fs.readFileSync('src/components/landing/ScrollVideoSection.tsx', 'utf8');
c = c.replace(/fontFamily:\s*'"Innovar", "Cinzel Decorative", serif',/g, 'fontFamily: \'"Innovar", "Cinzel Decorative", serif\',\n                                  textTransform: \'none\',');
fs.writeFileSync('src/components/landing/ScrollVideoSection.tsx', c);
