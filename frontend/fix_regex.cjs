
const fs = require('fs');

let mText = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
mText = mText.replace(/post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :[\s\S]*?post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :/g, 'post.myOffer.status === \\'REJECTED\\' ? \\'bg-red-500/10 text-red-400\\' :');
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', mText);

let pText = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
pText = pText.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :[\s\S]*?myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :/g, 'myOffer.status === \\'REJECTED\\' ? \\'text-red-400 border-red-500/20 bg-red-500/10\\' :');
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', pText);

