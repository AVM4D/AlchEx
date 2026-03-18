
const fs = require('fs');
const path = require('path');

// Fix index.css
let css = fs.readFileSync('C:/Alchex/frontend/src/index.css', 'utf8');
css = css.replace(/calc\(\s*\*\s*100\%\)/g, '20%');
fs.writeFileSync('C:/Alchex/frontend/src/index.css', css);

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('C:/Alchex/frontend/src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/text-\[var\(--bg\)\]/g, 'text-[var(--text)]');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
        }
    }
});
console.log('Fixed TSX texts and index.css');

