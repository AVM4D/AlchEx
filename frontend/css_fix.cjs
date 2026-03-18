
const fs = require('fs');
let css = fs.readFileSync('C:/Alchex/frontend/src/index.css', 'utf8');

css = css.replace(/rgba\(var\(--accent\),\s*0\.03\)/g, 'var(--accent-sub)');
css = css.replace(/rgba\(var\(--accent\),\s*0\.4\)/g, 'var(--accent-glow)');
css = css.replace(/color-mix\(in srgb, var\(--text-2\) calc\( \* 100%\), transparent\)/g, 'var(--accent-sub)');
fs.writeFileSync('C:/Alchex/frontend/src/index.css', css);

