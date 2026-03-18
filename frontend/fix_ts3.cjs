
const fs = require('fs');

let marketTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
marketTSX = marketTSX.replace(/=== 'WITHDRAWN'/g, '=== \'REJECTED\'');
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', marketTSX);

let postDTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
postDTSX = postDTSX.replace(/=== 'WITHDRAWN'/g, '=== \'REJECTED\'');
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', postDTSX);

