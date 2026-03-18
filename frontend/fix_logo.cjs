const fs = require('fs');
const files = [
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Header.tsx',
  'src/pages/AuthPage.tsx',
  'src/pages/LandingPage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/RegisterPage.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/<img[^>]*src="\/smalllogo\.png"[^>]*>/g, '<span className="font-logo text-2xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>');
    c = c.replace(/<img[^>]*src="\/logo\.jpeg"[^>]*>/g, '<span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>');
    fs.writeFileSync(f, c);
  }
});
