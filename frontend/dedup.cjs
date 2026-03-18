
const fs = require('fs');
let file = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');

// The lines are literally:
//                           post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
//                                 post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :

file = file.replace(/post\.myOffer\.status === 'REJECTED'.+\n.+post\.myOffer\.status === 'REJECTED'.+\n/g, post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :\n);

fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', file);

let p = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
p = p.replace(/myOffer\.status === 'REJECTED'.+\n.+myOffer\.status === 'REJECTED'.+\n/g, myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' :\n);
p = p.replace(/offer\.status === 'REJECTED'.+\n.+offer\.status === 'REJECTED'.+\n/g, offer.status === 'REJECTED' ? 'text-red-400 border-red-500/20' :\n);
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', p);

