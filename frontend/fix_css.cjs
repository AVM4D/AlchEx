
const fs = require('fs');
let css = fs.readFileSync('C:/Alchex/frontend/src/index.css', 'utf8');
css = css.replace(/\.text-\[var\(--text\)\]/g, '.text-accent');
fs.writeFileSync('C:/Alchex/frontend/src/index.css', css);

