
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
      
      content = content.replace(/to-purple-400/g, 'to-[var(--accent-2)]');
      content = content.replace(/hover:bg-purple-500/g, 'hover:bg-[var(--accent-2)]');
      content = content.replace(/hover:bg-purple-400/g, 'hover:bg-[var(--accent-2)]');
      content = content.replace(/via-purple-500/g, 'via-[var(--accent)]');
      content = content.replace(/via-purple-600/g, 'via-[var(--accent)]');
      content = content.replace(/from-purple-500\/20/g, 'from-[var(--accent)]/20');
      content = content.replace(/to-purple-600\/5/g, 'to-[var(--accent)]/5');
      content = content.replace(/to-purple-500/g, 'to-[var(--accent-2)]');
      content = content.replace(/bg-purple-500/g, 'bg-[var(--accent)]');
      content = content.replace(/bg-purple-600/g, 'bg-[var(--accent)]');
      content = content.replace(/text-purple-400/g, 'text-[var(--accent-2)]');
      content = content.replace(/text-purple-500/g, 'text-[var(--accent)]');
      content = content.replace(/border-purple-500/g, 'border-[var(--accent)]');
      content = content.replace(/border-purple-400/g, 'border-[var(--accent-2)]');
      content = content.replace(/orb-purple/g, 'orb-primary');
      content = content.replace(/orb-pink/g, 'orb-secondary');
      
      content = content.replace(/#8[Bb]5[Cc][Ff]6/g, 'var(--accent)');
      content = content.replace(/#[Aa]78[Bb][Ff][Aa]/g, 'var(--accent-2)');
      content = content.replace(/#[Cc]4[Bb]5[Ff][Dd]/g, 'var(--accent-3)');

      if (content !== orig) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}
walk('C:/Alchex/frontend/src');

