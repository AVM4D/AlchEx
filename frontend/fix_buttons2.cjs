
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

walkDir('C:/Alchex/frontend/src/components', (file) => {
    if (file.endsWith('.tsx')) {
        let fileContent = fs.readFileSync(file, 'utf8');
        let newContent = fileContent.replace(/(bg-\[var\(--accent\)\][^>]*?)text-\[var\(--text\)\]/g, '\-[var(--bg)]');
        newContent = newContent.replace(/(text-\[var\(--text\)\][^>]*?)bg-\[var\(--accent\)\]/g, 'text-[var(--bg)]-[var(--accent)]'); // rough fix for reverse
        if (fileContent !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed:', file);
        }
    }
});
walkDir('C:/Alchex/frontend/src/pages', (file) => {
    if (file.endsWith('.tsx')) {
        let fileContent = fs.readFileSync(file, 'utf8');
        let newContent = fileContent.replace(/(bg-\[var\(--accent\)\][^>]*?)text-\[var\(--text\)\]/g, '\-[var(--bg)]');
        newContent = newContent.replace(/(text-\[var\(--text\)\][^>]*?)bg-\[var\(--accent\)\]/g, 'text-[var(--bg)]-[var(--accent)]'); 
        if (fileContent !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log('Fixed:', file);
        }
    }
});

