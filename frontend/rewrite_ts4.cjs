
const fs = require('fs');

let m = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
m = m.replace(/post\.myOffer\.status === 'REJECTED' \? 'bg-red-500\/10 text-red-400' \:/g, '');
m = m.replace(/post\.myOffer\.status === 'ACCEPTED' \? 'bg-emerald-500\/10 text-emerald-400' \:/g, post.myOffer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', m);

let p = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
p = p.replace(/myOffer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20 bg-red-500\/10' \:/g, '');
p = p.replace(/myOffer\.status === 'ACCEPTED' \? 'text-emerald-400 border-emerald-500\/20 bg-emerald-500\/10' \:/g, myOffer.status === 'ACCEPTED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' :);

p = p.replace(/offer\.status === 'REJECTED' \? 'text-red-400 border-red-500\/20' \:/g, '');
p = p.replace(/offer\.status === 'ACCEPTED' \? 'text-emerald-400 border-emerald-500\/20' \:/g, offer.status === 'ACCEPTED' ? 'text-emerald-400 border-emerald-500/20' : offer.status === 'REJECTED' ? 'text-red-400 border-red-500/20' :);
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', p);

