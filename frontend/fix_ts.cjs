
const fs = require('fs');

let headerTSX = fs.readFileSync('C:/Alchex/frontend/src/components/layout/Header.tsx', 'utf8');
headerTSX = headerTSX.replace(/const { setSidebarOpen, sidebarCollapsed } = useUIStore\(\);/, 'const { setSidebarOpen } = useUIStore();');
fs.writeFileSync('C:/Alchex/frontend/src/components/layout/Header.tsx', headerTSX);

let marketTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', 'utf8');
marketTSX = marketTSX.replace(/post\.myOffer\.status === 'EXPIRED'/g, 'post.myOffer.status === \'REJECTED\'');
fs.writeFileSync('C:/Alchex/frontend/src/pages/MarketplacePage.tsx', marketTSX);

let postDTSX = fs.readFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', 'utf8');
postDTSX = postDTSX.replace(/myOffer\.status === 'EXPIRED'/g, 'myOffer.status === \'REJECTED\'');
postDTSX = postDTSX.replace(/offer\.status === 'EXPIRED'/g, 'offer.status === \'REJECTED\'');
fs.writeFileSync('C:/Alchex/frontend/src/pages/PostDetailPage.tsx', postDTSX);


