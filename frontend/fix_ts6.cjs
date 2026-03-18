
const fs = require('fs');

let postDTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
postDTSX = postDTSX.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :\s*myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' :/g, 'myOffer.status === \\'REJECTED\\' ? \\'text-red-400 border-red-500/20 bg-red-500/10\\' :');

fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', postDTSX);
console.log('done');

