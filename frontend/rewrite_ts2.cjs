
const fs = require('fs');

let text = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');

const regex = /post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\\/10 text-red-400' :\s*post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\\/10 text-red-400' :/g;
text = text.replace(regex, post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', text);

let text2 = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
const regex2 = /myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\\/20 bg-red-500\\/10' :\s*myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\\/20 bg-red-500\\/10' :/g;
text2 = text2.replace(regex2, myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', text2);

