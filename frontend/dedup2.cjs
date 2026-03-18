
const fs = require('fs');

let lines = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8').split('\n');
let newLines = [];
let lastLine = '';
for (let line of lines) {
    if (line.trim() === lastLine.trim() && line.includes('REJECTED')) {
        continue; // skip duplicate REJECTED line
    }
    newLines.push(line);
    lastLine = line;
}
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', newLines.join('\n'));

lines = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8').split('\n');
newLines = [];
lastLine = '';
for (let line of lines) {
    if (line.trim() === lastLine.trim() && line.includes('REJECTED')) {
        continue;
    }
    newLines.push(line);
    lastLine = line;
}
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', newLines.join('\n'));


