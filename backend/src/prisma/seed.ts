import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Seeding AlchEx database with dummy data...\n');

  // ─── Clean existing data (order matters for FK constraints) ───
  console.log('🗑️  Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.leaderboardSnapshot.deleteMany();
  await prisma.report.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Users ───
  console.log('👥 Creating users...');
  const password = await bcrypt.hash('Test@1234', 12);

  const usersData = [
    { email: 'admin@alchex.io', firstName: 'Admin', lastName: 'AlchEx', role: 'ADMIN', university: 'NUST', campus: 'H-12', program: 'CS', batch: '2024', bio: 'Platform administrator', reputationScore: 100, totalExchanges: 50 },
    { email: 'demo@university.edu', firstName: 'Demo', lastName: 'User', role: 'ADMIN', university: 'NUST', campus: 'H-12', program: 'SE', batch: '2023', bio: 'Full-stack developer and avid reader', reputationScore: 85, totalExchanges: 32 },
    { email: 'sarah@university.edu', firstName: 'Sarah', lastName: 'Chen', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'CS', batch: '2024', bio: 'ML enthusiast. Always looking for good textbooks.', reputationScore: 92, totalExchanges: 41 },
    { email: 'ahmed@university.edu', firstName: 'Ahmed', lastName: 'Raza', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'EE', batch: '2023', bio: 'Electronics wizard. I build stuff.', reputationScore: 78, totalExchanges: 28 },
    { email: 'maria@university.edu', firstName: 'Maria', lastName: 'Garcia', role: 'STUDENT', university: 'LUMS', campus: 'Main', program: 'BBA', batch: '2024', bio: 'Business student. Love trading notes!', reputationScore: 65, totalExchanges: 19 },
    { email: 'javad@university.edu', firstName: 'Javad', lastName: 'Khan', role: 'STUDENT', university: 'FAST', campus: 'Islamabad', program: 'CS', batch: '2022', bio: 'Senior dev. Can tutor anything CS.', reputationScore: 95, totalExchanges: 55 },
    { email: 'zara@university.edu', firstName: 'Zara', lastName: 'Ali', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'BIO', batch: '2024', bio: 'Biotech student. Need lab equipment!', reputationScore: 45, totalExchanges: 10 },
    { email: 'omar@university.edu', firstName: 'Omar', lastName: 'Farooq', role: 'STUDENT', university: 'COMSATS', campus: 'Islamabad', program: 'SE', batch: '2023', bio: 'Freelancer + student. Trading services.', reputationScore: 72, totalExchanges: 25 },
    { email: 'hina@university.edu', firstName: 'Hina', lastName: 'Malik', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'ARCH', batch: '2024', bio: 'Architecture student. Always sketching.', reputationScore: 58, totalExchanges: 14 },
    { email: 'ali@university.edu', firstName: 'Ali', lastName: 'Hassan', role: 'STUDENT', university: 'GIKI', campus: 'Topi', program: 'ME', batch: '2023', bio: 'Mechanical engineering + 3D printing.', reputationScore: 88, totalExchanges: 38 },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: { ...u, passwordHash: password, emailVerified: true },
    });
    users.push(user);
  }
  console.log(`   ✅ Created ${users.length} users`);

  // ─── Create Posts ───
  console.log('📝 Creating posts...');
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const postsData = [
    { userId: users[1].id, title: 'Trading Calculus Textbook for Linear Algebra', description: 'I have the 8th edition of Stewart Calculus in great condition. Looking for any Linear Algebra textbook, preferably Lay or Strang.', whatINeed: 'Linear Algebra textbook (Lay 5th+ or Strang)', whatIOffer: 'Stewart Calculus 8th Edition', category: 'Textbooks', tags: 'math,calculus,linear-algebra', status: 'ACTIVE' },
    { userId: users[2].id, title: 'Python tutoring for web design help', description: 'I can teach Python, NumPy, Pandas, and basic ML. Looking for someone who can help me learn Figma and UI/UX design.', whatINeed: 'Figma/UI/UX design tutoring (5 sessions)', whatIOffer: 'Python + ML tutoring (5 sessions)', category: 'Tutoring', tags: 'python,ml,figma,design', status: 'ACTIVE' },
    { userId: users[3].id, title: 'Arduino Mega 2560 + sensors bundle', description: 'Full Arduino kit with 20+ sensors, breadboard, jumper wires. Used for one semester project. Looking for a Raspberry Pi or equivalent.', whatINeed: 'Raspberry Pi 4 (any RAM config)', whatIOffer: 'Arduino Mega 2560 + 20 sensors + accessories', category: 'Electronics', tags: 'arduino,raspberry-pi,iot', status: 'ACTIVE' },
    { userId: users[4].id, title: 'Financial Accounting notes for Marketing notes', description: 'Complete semester notes for FA, hand-written and organized by topic. Need good Marketing Management notes.', whatINeed: 'Marketing Management notes (Kotler based)', whatIOffer: 'Financial Accounting complete notes', category: 'Notes', tags: 'accounting,marketing,bba', status: 'ACTIVE' },
    { userId: users[5].id, title: 'Full-stack web project for mobile app', description: 'I will build you a complete MERN stack web app (frontend + backend + deployment) in exchange for a React Native mobile app.', whatINeed: 'React Native mobile app development', whatIOffer: 'Full-stack MERN web application', category: 'Services', tags: 'mern,react-native,fullstack', status: 'ACTIVE' },
    { userId: users[6].id, title: 'Looking for microscope slides', description: 'Need prepared microscope slides for botany lab. Can offer organic chemistry lab manual and notes.', whatINeed: 'Prepared microscope slides (botany, 50+)', whatIOffer: 'Organic Chemistry lab manual + notes', category: 'Lab Equipment', tags: 'biology,chemistry,lab', status: 'ACTIVE' },
    { userId: users[7].id, title: 'Logo design for assignment help', description: 'Professional logo designer. Will create a complete brand identity package in exchange for help with Data Structures assignment.', whatINeed: 'Help with DSA assignment (trees & graphs)', whatIOffer: 'Logo + brand identity package', category: 'Services', tags: 'design,logo,dsa', status: 'ACTIVE' },
    { userId: users[8].id, title: 'Architecture model supplies trade', description: 'I have extra bass wood, foam board, and X-Acto knives. Looking for quality sketch markers or watercolor set.', whatINeed: 'Copic markers or Winsor Newton watercolors', whatIOffer: 'Bass wood + foam board + cutting tools', category: 'Other', tags: 'architecture,art,supplies', status: 'ACTIVE' },
    { userId: users[9].id, title: '3D printing service for CAD modeling', description: 'I have access to a professional 3D printer. Will print your models in exchange for SolidWorks/CAD modeling help.', whatINeed: 'SolidWorks CAD modeling (complex assemblies)', whatIOffer: '3D printing service (up to 500g PLA)', category: 'Services', tags: '3d-printing,cad,solidworks', status: 'ACTIVE' },
    { userId: users[1].id, title: 'DSA course materials for OOP notes', description: 'Complete Data Structures & Algorithms course pack including solved assignments, past papers, and lecture slides.', whatINeed: 'OOP (Java) complete course materials', whatIOffer: 'DSA complete course pack', category: 'Notes', tags: 'dsa,oop,java,cs', status: 'ACTIVE' },
    { userId: users[2].id, title: 'GPU rental for cloud credits', description: 'I have an RTX 3080 desktop. You can use it for ML training for a week. Looking for AWS/GCP credits.', whatINeed: '$50+ AWS or GCP cloud credits', whatIOffer: 'RTX 3080 access for 1 week', category: 'Electronics', tags: 'gpu,cloud,ml', status: 'ACTIVE' },
    { userId: users[3].id, title: 'Circuit board design for PCB printing', description: 'I can design custom PCBs using Altium Designer. Looking for someone who can manufacture/print PCBs.', whatINeed: 'PCB manufacturing (up to 10 boards)', whatIOffer: 'Custom PCB design in Altium Designer', category: 'Services', tags: 'pcb,altium,electronics', status: 'ACTIVE' },
    { userId: users[5].id, title: 'Resume writing for LinkedIn optimization', description: 'I will write your tech resume (ATS optimized, action verbs, metrics) in exchange for LinkedIn profile optimization.', whatINeed: 'LinkedIn profile complete makeover', whatIOffer: 'ATS-optimized tech resume', category: 'Services', tags: 'resume,linkedin,career', status: 'ACTIVE' },
    { userId: users[4].id, title: 'Ride share: LUMS to Lahore Airport', description: 'I drive to the airport every Friday. Looking for someone to share fuel costs or offer campus parking spot.', whatINeed: 'Reserved parking spot near SSE building', whatIOffer: 'Weekly ride to Lahore Airport', category: 'Transportation', tags: 'ride,airport,parking', status: 'ACTIVE' },
    { userId: users[7].id, title: 'Web scraping script for data cleaning', description: 'I can build Python web scrapers for any website. Need someone who can help clean and format dataset in Excel/Power BI.', whatINeed: 'Data cleaning & Power BI dashboard', whatIOffer: 'Custom Python web scraper', category: 'Services', tags: 'python,scraping,powerbi', status: 'ACTIVE' },
  ];

  const posts = [];
  for (let i = 0; i < postsData.length; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const created = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const post = await prisma.post.create({
      data: { ...postsData[i], expiresAt: inAMonth, createdAt: created },
    });
    posts.push(post);
  }
  console.log(`   ✅ Created ${posts.length} posts`);

  // ─── Create Offers ───
  console.log('🤝 Creating offers...');
  const offersData = [
    { postId: posts[0].id, userId: users[2].id, proposalDescription: 'I have Lay\'s Linear Algebra 6th edition. Almost new!', status: 'PENDING' },
    { postId: posts[0].id, userId: users[5].id, proposalDescription: 'I have Strang\'s Introduction to Linear Algebra. Willing to trade!', counterExchange: 'Would also love any Discrete Math book if you have one', status: 'PENDING' },
    { postId: posts[1].id, userId: users[8].id, proposalDescription: 'I\'m a design student! Can teach Figma, Adobe XD, and color theory.', status: 'PENDING' },
    { postId: posts[1].id, userId: users[7].id, proposalDescription: 'I know Figma well and can do 5 sessions. I also need Python help!', status: 'ACCEPTED' },
    { postId: posts[2].id, userId: users[9].id, proposalDescription: 'I have a Raspberry Pi 4 (4GB RAM) barely used. Perfect trade!', status: 'ACCEPTED' },
    { postId: posts[3].id, userId: users[1].id, proposalDescription: 'I have Kotler Marketing Management notes from last semester.', status: 'PENDING' },
    { postId: posts[4].id, userId: users[7].id, proposalDescription: 'I can build React Native apps! Built 3 apps already on the store.', status: 'PENDING' },
    { postId: posts[5].id, userId: users[3].id, proposalDescription: 'I have 60 prepared botany slides from my lab course.', status: 'PENDING' },
    { postId: posts[6].id, userId: users[2].id, proposalDescription: 'I\'m great at DSA! Can help with trees, graphs, and dynamic programming.', status: 'PENDING' },
    { postId: posts[7].id, userId: users[4].id, proposalDescription: 'I have a barely used Copic marker set (24 colors).', status: 'PENDING' },
    { postId: posts[9].id, userId: users[3].id, proposalDescription: 'I have complete OOP Java notes with solved exercises.', status: 'PENDING' },
    { postId: posts[10].id, userId: users[5].id, proposalDescription: 'I have $75 in GCP credits from a hackathon. Happy to trade!', status: 'PENDING' },
  ];

  const offers = [];
  for (const o of offersData) {
    const offer = await prisma.offer.create({ data: o });
    offers.push(offer);
  }
  console.log(`   ✅ Created ${offers.length} offers`);

  // ─── Create Transactions (from accepted offers) ───
  console.log('🔄 Creating transactions...');
  // Offer at index 3 is accepted (post 1, user 7 → requester is post owner users[2])
  const tx1 = await prisma.transaction.create({
    data: {
      postId: posts[1].id, offerId: offers[3].id,
      requesterId: users[2].id, offererId: users[7].id,
      status: 'IN_PROGRESS', expiresAt: inAMonth,
    },
  });
  await prisma.post.update({ where: { id: posts[1].id }, data: { status: 'IN_PROGRESS' } });

  // Offer at index 4 is accepted (post 2, user 9 → requester is post owner users[3])
  const tx2 = await prisma.transaction.create({
    data: {
      postId: posts[2].id, offerId: offers[4].id,
      requesterId: users[3].id, offererId: users[9].id,
      status: 'SUCCESSFUL', requesterDone: true, offererDone: true,
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), expiresAt: inAMonth,
    },
  });
  await prisma.post.update({ where: { id: posts[2].id }, data: { status: 'SUCCESSFUL' } });

  // Create a few more historical transactions
  // Create a dummy post + offer for completed transaction
  const histPost1 = await prisma.post.create({
    data: { userId: users[5].id, title: 'Algorithm textbook exchange', description: 'CLRS for Skiena', whatINeed: 'Skiena Algorithm Design Manual', whatIOffer: 'CLRS Introduction to Algorithms', category: 'Textbooks', tags: 'algorithms', status: 'SUCCESSFUL', expiresAt: inAMonth, createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
  });
  const histOffer1 = await prisma.offer.create({
    data: { postId: histPost1.id, userId: users[1].id, proposalDescription: 'I have Skiena!', status: 'ACCEPTED' },
  });
  const tx3 = await prisma.transaction.create({
    data: {
      postId: histPost1.id, offerId: histOffer1.id,
      requesterId: users[5].id, offererId: users[1].id,
      status: 'SUCCESSFUL', requesterDone: true, offererDone: true,
      completedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), expiresAt: inAMonth,
      createdAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
    },
  });

  const histPost2 = await prisma.post.create({
    data: { userId: users[1].id, title: 'Physics lab report for Chemistry help', description: 'Need help with organic chem', whatINeed: 'Organic Chemistry tutoring', whatIOffer: 'Physics lab report template', category: 'Tutoring', tags: 'physics,chemistry', status: 'CANCELLED', expiresAt: inAMonth, createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) },
  });
  const histOffer2 = await prisma.offer.create({
    data: { postId: histPost2.id, userId: users[6].id, proposalDescription: 'I can help with organic chem!', status: 'ACCEPTED' },
  });
  const tx4 = await prisma.transaction.create({
    data: {
      postId: histPost2.id, offerId: histOffer2.id,
      requesterId: users[1].id, offererId: users[6].id,
      status: 'CANCELLED', requesterCancel: true,
      cancelledAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), expiresAt: inAMonth,
      createdAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('   ✅ Created 4 transactions');

  // ─── Create Messages ───
  console.log('💬 Creating messages...');
  const msgData = [
    // tx1 messages (Sarah ↔ Omar, tutoring exchange)
    { transactionId: tx1.id, senderId: tx1.id === tx1.id ? users[2].id : users[2].id, content: 'Hey! Excited to start the tutoring exchange 🎉', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[2].id, content: 'Hey! Excited to start the tutoring exchange 🎉', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[7].id, content: 'Same here! When would you like to have the first session?', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[2].id, content: 'How about Thursday at 3 PM in the library?', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[7].id, content: 'Perfect! I\'ll bring my laptop with Figma ready. Should I prepare anything specific?', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[2].id, content: 'Yes! Can you start with the basics of auto-layout and components?', messageType: 'TEXT' },
    { transactionId: tx1.id, senderId: users[7].id, content: 'Absolutely! I\'ll prepare a mini project we can build together.', messageType: 'TEXT' },

    // tx2 messages (Ahmed ↔ Ali, electronics exchange)
    { transactionId: tx2.id, senderId: users[3].id, content: 'Got your Raspberry Pi! It\'s in perfect condition.', messageType: 'TEXT' },
    { transactionId: tx2.id, senderId: users[9].id, content: 'Great! The Arduino kit is amazing, all sensors work perfectly.', messageType: 'TEXT' },
    { transactionId: tx2.id, senderId: users[3].id, content: 'Glad to hear it! Let me mark this as complete.', messageType: 'TEXT' },
    { transactionId: tx2.id, senderId: 'SYSTEM', content: 'Transaction marked as complete by both parties.', messageType: 'SYSTEM' },

    // tx3 messages
    { transactionId: tx3.id, senderId: users[5].id, content: 'Got the Skiena book, thanks!', messageType: 'TEXT' },
    { transactionId: tx3.id, senderId: users[1].id, content: 'CLRS is in great condition. Happy trading!', messageType: 'TEXT' },
  ];

  // Fix: remove the duplicate first message and system messages with invalid senderId
  const validMsgs = msgData.filter(m => m.senderId !== 'SYSTEM').slice(1);
  const systemMsgs = msgData.filter(m => m.senderId === 'SYSTEM');

  for (let i = 0; i < validMsgs.length; i++) {
    const minutesAgo = (validMsgs.length - i) * 15;
    await prisma.message.create({
      data: {
        ...validMsgs[i],
        createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
      },
    });
  }
  // System messages with first valid user as sender
  for (const sm of systemMsgs) {
    await prisma.message.create({
      data: {
        transactionId: sm.transactionId,
        senderId: users[0].id, // admin as system
        content: sm.content,
        messageType: 'SYSTEM',
      },
    });
  }
  console.log(`   ✅ Created ${validMsgs.length + systemMsgs.length} messages`);

  // ─── Create Ratings ───
  console.log('⭐ Creating ratings...');
  const ratingsData = [
    // tx2 ratings (completed)
    { transactionId: tx2.id, giverId: users[3].id, receiverId: users[9].id, score: 5, review: 'Amazing trade! Raspberry Pi was in perfect condition. Highly recommend Ali!' },
    { transactionId: tx2.id, giverId: users[9].id, receiverId: users[3].id, score: 5, review: 'Ahmed is very trustworthy. Arduino kit had everything as described.' },
    // tx3 ratings
    { transactionId: tx3.id, giverId: users[5].id, receiverId: users[1].id, score: 4, review: 'Good trade. Book was in decent condition.' },
    { transactionId: tx3.id, giverId: users[1].id, receiverId: users[5].id, score: 5, review: 'Javad is excellent! Skiena book was pristine.' },
  ];

  for (const r of ratingsData) {
    await prisma.rating.create({ data: r });
  }
  console.log(`   ✅ Created ${ratingsData.length} ratings`);

  // ─── Create Reports ───
  console.log('🚨 Creating reports...');
  await prisma.report.create({
    data: {
      transactionId: tx4.id,
      reporterId: users[6].id,
      targetUserId: users[1].id,
      reason: 'Unresponsive',
      description: 'The requester cancelled the transaction without any communication. They stopped responding to messages after accepting my offer.',
      status: 'PENDING',
    },
  });
  console.log('   ✅ Created 1 report');

  // ─── Create Notifications ───
  console.log('🔔 Creating notifications...');
  const notifsData = [
    { userId: users[1].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Sarah Chen made an offer on your "Trading Calculus Textbook" post' },
    { userId: users[1].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Javad Khan made an offer on your "Trading Calculus Textbook" post' },
    { userId: users[2].id, type: 'OFFER_ACCEPTED', title: 'Offer accepted!', message: 'Your offer on "Python tutoring for web design help" was accepted by Omar Farooq' },
    { userId: users[3].id, type: 'TRANSACTION_COMPLETE', title: 'Transaction completed', message: 'Your exchange "Arduino Mega 2560 + sensors bundle" is now complete!' },
    { userId: users[5].id, type: 'SYSTEM', title: 'Welcome to AlchEx!', message: 'Start trading by creating a post or browsing the marketplace.' },
    { userId: users[7].id, type: 'MESSAGE', title: 'New message', message: 'Sarah Chen sent you a message about the tutoring exchange' },
    { userId: users[2].id, type: 'SYSTEM', title: 'Reputation milestone!', message: 'Congratulations! You\'ve reached 90+ reputation score.' },
    { userId: users[9].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Someone made an offer on your 3D printing service post' },
  ];

  for (let i = 0; i < notifsData.length; i++) {
    await prisma.notification.create({
      data: {
        ...notifsData[i],
        isRead: i < 3, // First 3 are read
        createdAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`   ✅ Created ${notifsData.length} notifications`);

  // ─── Leaderboard Snapshots ───
  console.log('🏆 Creating leaderboard snapshots...');
  const sortedUsers = [...users].sort((a, b) => b.reputationScore - a.reputationScore);
  for (let i = 0; i < sortedUsers.length; i++) {
    await prisma.leaderboardSnapshot.create({
      data: {
        userId: sortedUsers[i].id,
        rank: i + 1,
        reputationScore: sortedUsers[i].reputationScore,
        totalExchanges: sortedUsers[i].totalExchanges,
        averageRating: 3.5 + Math.random() * 1.5,
        period: 'ALL_TIME',
        snapshotDate: now,
      },
    });
  }
  console.log(`   ✅ Created ${sortedUsers.length} leaderboard entries`);

  console.log('\n✨ Seeding complete! Summary:');
  console.log(`   👥 ${users.length} users (password: Test@1234)`);
  console.log(`   📝 ${posts.length + 2} posts`);
  console.log(`   🤝 ${offers.length + 2} offers`);
  console.log(`   🔄 4 transactions`);
  console.log(`   💬 ${validMsgs.length + systemMsgs.length} messages`);
  console.log(`   ⭐ ${ratingsData.length} ratings`);
  console.log(`   🚨 1 report`);
  console.log(`   🔔 ${notifsData.length} notifications`);
  console.log(`   🏆 ${sortedUsers.length} leaderboard entries`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@alchex.io / Test@1234');
  console.log('   Demo:  demo@university.edu / Test@1234');
  console.log('   All users share password: Test@1234');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
