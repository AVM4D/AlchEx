
const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' \:[\s\S]*?'bg-gray-500\/10 text-gray-400'/g, post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400');
    fs.writeFileSync(file, text);
}

fix('C:/Alchex/frontend/src/pages/MarketplacePage.tsx');

let text = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
text = text.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' \:[\s\S]*?'text-gray-400 bg-gray-500\/10 border-gray-500\/20'/g, myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-gray-400 bg-gray-500/10 border-gray-500/20');

text = text.replace(/offer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20' \:\s*offer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20' \:/g, offer.status === 'REJECTED' ? 'text-red-400 border-red-500/20' :);

fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', text);


