
const fs = require('fs');
let css = fs.readFileSync('C:/Alchex/frontend/src/index.css', 'utf8');

css = css.replace(/124,\s*58,\s*237/g, 'var(--accent)');
css = css.replace(/167,\s*139,\s*250/g, 'var(--accent)');
css = css.replace(/#1e0c35/g, 'var(--surface-3)');
css = css.replace(/#1a0a2e/g, 'var(--surface)');
css = css.replace(/#150826/g, 'var(--bg)');
css = css.replace(/#f0eff4/g, 'var(--surface-3)');
css = css.replace(/#e8e6ee/g, 'var(--surface)');
css = css.replace(/#ededf2/g, 'var(--bg)');
css = css.replace(/#f5f4f8/g, 'var(--surface)');

// Need to fix rgba(var(--accent), ...) back to var(--accent-glow) or color-mix since CSS var(--accent) has hex
css = css.replace(/rgba\(var\(--accent\),\s*([0-9.]+)\)/g, 'color-mix(in srgb, var(--accent) calc( * 100%), transparent)');

// Let's replace rgba(14, 12, 22, 0.92) with var(--surface) and opacity
css = css.replace(/rgba\(14, 12, 22, 0\.92\)/g, 'color-mix(in srgb, var(--surface) 92%, transparent)');

fs.writeFileSync('C:/Alchex/frontend/src/index.css', css);

