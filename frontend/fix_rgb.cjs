
const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(tsx|ts|css)$/.test(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const orig = content;
      
      // Fix rgb(139,92,246) variants in tailwind arbitrary values
      content = content.replace(/rgba\(139,92,246,0\.1\)/g, 'var(--accent-sub)');
      content = content.replace(/rgba\(139,92,246,0\.2\)/g, 'var(--accent-sub)');
      content = content.replace(/rgba\(139,92,246,0\.3\)/g, 'var(--accent-glow)');
      content = content.replace(/rgba\(139,92,246,0\.4\)/g, 'var(--accent-glow)');
      content = content.replace(/rgba\(139,92,246,0\.5\)/g, 'var(--accent-glow)');
      content = content.replace(/139,\s*92,\s*246/g, '255, 255, 255'); // Particle field fallback
      
      // Fix text-white
      content = content.replace(/text-white/g, 'text-[var(--bg)]');

      // Fix bad gradients from previous replace
      content = content.replace(/via-primary-500/g, 'via-[var(--accent)]');
      content = content.replace(/to-primary-400/g, 'to-[var(--accent-2)]');
      content = content.replace(/to-secondary/g, 'to-[var(--accent-2)]');
      content = content.replace(/bg-primary-500/g, 'bg-[var(--accent)]');
      content = content.replace(/hover:bg-primary-500/g, 'hover:bg-[var(--accent-2)]');

      // fix specific user complains
      content = content.replace(/bg-gradient-to-r from-\[var\(--accent\)\] to-\[var\(--accent-2\)\]/g, 'bg-gradient-to-r from-[var(--bg)] to-[var(--surface-3)]');
      content = content.replace(/text-primary/g, 'text-[var(--text)]'); // Or keep something

      if (content !== orig) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}
walk('C:/Alchex/frontend/src');

