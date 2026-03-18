
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
      
      content = content.replace(/rgba\(139,\s*92,\s*246,\s*([0-9.]+)\)/g, 'rgba(var(--text), )'); // We don't have RGB vars yet, let's use var() but Tailwind arbitrary values support CSS vars with alphas via var() if formatted properly. Let's just fix it to standard tailwind using our variables. Wait, let's replace with tailwind classes or just simpler inline. Let's do var(--accent-glow) if possible, but let's replace string literals first.
    }
  }
}

