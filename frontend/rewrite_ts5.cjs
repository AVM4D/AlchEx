
const fs = require('fs');

let m = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
m = m.replace(/post\.myOffer\.status === 'REJECTED' \?.*?\n\s*post\.myOffer\.status === 'REJECTED' \?/g, post.myOffer.status === 'REJECTED' ?);
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', m);

let p = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
p = p.replace(/myOffer\.status === 'REJECTED' \?.*?\n\s*myOffer\.status === 'REJECTED' \?/g, myOffer.status === 'REJECTED' ?);
p = p.replace(/offer\.status === 'REJECTED' \?.*?\n\s*offer\.status === 'REJECTED' \?/g, offer.status === 'REJECTED' ?);
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', p);

