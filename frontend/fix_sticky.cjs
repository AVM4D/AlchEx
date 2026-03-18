const fs = require('fs');
let css = fs.readFileSync('src/components/ui/StickyReveal.css', 'utf8');

css = css.replace(/\.sticky-reveal__ul \{\s*\n\s*font-weight: 600;\s*\n\s*padding-inline: 0;\s*\n\s*margin: 0;\s*\n\s*list-style-type: none;\s*\n\s*font-family: var\(--font-display, 'Syne', sans-serif\);\s*\n\}/, 
`.sticky-reveal__ul {
    font-weight: 400;
    padding-inline: 0;
    margin: 0;
    list-style-type: none;
    font-family: var(--font-quote);
    text-transform: none;
}`);

fs.writeFileSync('src/components/ui/StickyReveal.css', css);
