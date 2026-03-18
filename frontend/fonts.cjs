
const fs = require('fs');

let css = fs.readFileSync('C:/Alchex/frontend/src/index.css', 'utf8');
css = css.replace(/family=Syne:wght@400;500;600;700;800/g, 'family=Great+Vibes');
css = css.replace(/--font-display: 'Syne', sans-serif;/g, '--font-display: \'Space Grotesk\', sans-serif;\n    --font-quote: \'Great Vibes\', cursive;');

// It might be .font-display instead of .text-display, let's just aggressively apply it
css = css.replace(/\.text-display \{[\s\n]+font-family: var\(--font-display\);[\s\n]+font-weight: 800;/g, '.text-display {\n    font-family: var(--font-display);\n    font-weight: 700;\n    text-transform: uppercase;');

fs.writeFileSync('C:/Alchex/frontend/src/index.css', css);

let tw = fs.readFileSync('C:/Alchex/frontend/tailwind.config.js', 'utf8');
tw = tw.replace(/display: \['Syne', 'sans-serif'\],/g, display: ['Space Grotesk', 'sans-serif'],\n        quote: ['Great Vibes', 'cursive'],);
fs.writeFileSync('C:/Alchex/frontend/tailwind.config.js', tw);

let sticky = fs.readFileSync('C:/Alchex/frontend/src/components/ui/StickyReveal.css', 'utf8');
sticky = sticky.replace(/'Syne'/g, '\\'Space Grotesk\\'');
fs.writeFileSync('C:/Alchex/frontend/src/components/ui/StickyReveal.css', sticky);

console.log('Fonts updated successfully');

