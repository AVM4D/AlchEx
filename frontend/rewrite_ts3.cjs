
const fs = require('fs');
let text = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
text = text.replace(/post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :\s*post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :/, post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', text);
console.log('Done 1!');

let text2 = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
text2 = text2.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :\s*myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :/, myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' :);
text2 = text2.replace(/offer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20' :\s*offer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20' :/, offer.status === 'REJECTED' ? 'text-red-400 border-red-500/20' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', text2);

