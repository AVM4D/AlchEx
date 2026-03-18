
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

let modified = [];
walkDir('C:/Alchex/frontend/src/pages', (file) => {
    if (file.endsWith('.tsx')) {
        let fileContent = fs.readFileSync(file, 'utf8');
        let newContent = fileContent.replace(/(bg-\[var\(--accent\)\][^>]*?)text-\[var\(--text\)\]/g, '\-[var(--bg)]');
        if (fileContent !== newContent) {
            fs.writeFileSync(file, newContent);
            modified.push(file);
        }
    }
});
console.log('Fixed buttons in: ' + modified.join(', '));

