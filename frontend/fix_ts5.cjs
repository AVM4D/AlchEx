
const fs = require('fs');

let marketTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
marketTSX = marketTSX.replace(/post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :\s*post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' :/g, 'post.myOffer.status === \\'REJECTED\\' ? \\'bg-red-500/10 text-red-400\\' :');
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', marketTSX);

let postDTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
postDTSX = postDTSX.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :\s*myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :/g, 'myOffer.status === \\'REJECTED\\' ? \\'text-red-400 border-red-500/20 bg-red-500/10\\' :');
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', postDTSX);

