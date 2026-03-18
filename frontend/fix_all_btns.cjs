
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walkDir('C:/Alchex/frontend/src', (file) => {
    if (file.endsWith('.tsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content.replace(/ \-\[var\(--bg\)\]/g, ' bg-[var(--accent)] text-[var(--bg)]');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed', file);
        }
    }
});

