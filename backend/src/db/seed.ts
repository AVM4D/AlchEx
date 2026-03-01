import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import db from '../db/connection';

function uuid() { return crypto.randomUUID(); }

async function main() {
  console.log('🧪 Seeding AlchEx database with dummy data...\n');

  // ─── Clean existing data (order matters for FK constraints) ───
  console.log('🗑️  Cleaning existing data...');
  await db.execute`DELETE FROM notifications`;
  await db.execute`DELETE FROM leaderboard_snapshots`;
  await db.execute`DELETE FROM reports`;
  await db.execute`DELETE FROM ratings`;
  await db.execute`DELETE FROM messages`;
  await db.execute`DELETE FROM transactions`;
  await db.execute`DELETE FROM offers`;
  await db.execute`DELETE FROM posts`;
  await db.execute`DELETE FROM users`;

  // ─── Create Users ───
  console.log('👥 Creating users...');
  const password = await bcrypt.hash('Test@1234', 12);
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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

  const users: { id: string; reputationScore: number; totalExchanges: number }[] = [];
  for (const u of usersData) {
    const id = uuid();
    await db.execute`
      INSERT INTO users (id, email, passwordHash, firstName, lastName, role, university, campus, [program], batch, bio,
                         reputationScore, totalExchanges, emailVerified, isBanned, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${u.email}, ${password}, ${u.firstName}, ${u.lastName}, ${u.role}, ${u.university}, ${u.campus},
              ${u.program}, ${u.batch}, ${u.bio}, ${u.reputationScore}, ${u.totalExchanges}, 1, 0, 0, ${now}, ${now})
    `;
    users.push({ id, reputationScore: u.reputationScore, totalExchanges: u.totalExchanges });
  }
  console.log(`   ✅ Created ${users.length} users`);

  // ─── Create Posts ───
  console.log('📝 Creating posts...');
  const postsData = [
    { userId: users[1].id, title: 'Trading Calculus Textbook for Linear Algebra', description: 'I have the 8th edition of Stewart Calculus in great condition.', whatINeed: 'Linear Algebra textbook (Lay 5th+ or Strang)', whatIOffer: 'Stewart Calculus 8th Edition', category: 'Textbooks', tags: 'math,calculus,linear-algebra', status: 'ACTIVE' },
    { userId: users[2].id, title: 'Python tutoring for web design help', description: 'I can teach Python, NumPy, Pandas, and basic ML.', whatINeed: 'Figma/UI/UX design tutoring (5 sessions)', whatIOffer: 'Python + ML tutoring (5 sessions)', category: 'Tutoring', tags: 'python,ml,figma,design', status: 'ACTIVE' },
    { userId: users[3].id, title: 'Arduino Mega 2560 + sensors bundle', description: 'Full Arduino kit with 20+ sensors, breadboard, jumper wires.', whatINeed: 'Raspberry Pi 4 (any RAM config)', whatIOffer: 'Arduino Mega 2560 + 20 sensors + accessories', category: 'Electronics', tags: 'arduino,raspberry-pi,iot', status: 'ACTIVE' },
    { userId: users[4].id, title: 'Financial Accounting notes for Marketing notes', description: 'Complete semester notes for FA, hand-written and organized by topic.', whatINeed: 'Marketing Management notes (Kotler based)', whatIOffer: 'Financial Accounting complete notes', category: 'Notes', tags: 'accounting,marketing,bba', status: 'ACTIVE' },
    { userId: users[5].id, title: 'Full-stack web project for mobile app', description: 'I will build you a complete MERN stack web app.', whatINeed: 'React Native mobile app development', whatIOffer: 'Full-stack MERN web application', category: 'Services', tags: 'mern,react-native,fullstack', status: 'ACTIVE' },
    { userId: users[6].id, title: 'Looking for microscope slides', description: 'Need prepared microscope slides for botany lab.', whatINeed: 'Prepared microscope slides (botany, 50+)', whatIOffer: 'Organic Chemistry lab manual + notes', category: 'Lab Equipment', tags: 'biology,chemistry,lab', status: 'ACTIVE' },
    { userId: users[7].id, title: 'Logo design for assignment help', description: 'Professional logo designer.', whatINeed: 'Help with DSA assignment (trees & graphs)', whatIOffer: 'Logo + brand identity package', category: 'Services', tags: 'design,logo,dsa', status: 'ACTIVE' },
    { userId: users[8].id, title: 'Architecture model supplies trade', description: 'I have extra bass wood, foam board, and X-Acto knives.', whatINeed: 'Copic markers or Winsor Newton watercolors', whatIOffer: 'Bass wood + foam board + cutting tools', category: 'Other', tags: 'architecture,art,supplies', status: 'ACTIVE' },
    { userId: users[9].id, title: '3D printing service for CAD modeling', description: 'I have access to a professional 3D printer.', whatINeed: 'SolidWorks CAD modeling (complex assemblies)', whatIOffer: '3D printing service (up to 500g PLA)', category: 'Services', tags: '3d-printing,cad,solidworks', status: 'ACTIVE' },
    { userId: users[1].id, title: 'DSA course materials for OOP notes', description: 'Complete DSA course pack with solved assignments.', whatINeed: 'OOP (Java) complete course materials', whatIOffer: 'DSA complete course pack', category: 'Notes', tags: 'dsa,oop,java,cs', status: 'ACTIVE' },
    { userId: users[2].id, title: 'GPU rental for cloud credits', description: 'RTX 3080 for ML training.', whatINeed: '$50+ AWS or GCP cloud credits', whatIOffer: 'RTX 3080 access for 1 week', category: 'Electronics', tags: 'gpu,cloud,ml', status: 'ACTIVE' },
    { userId: users[3].id, title: 'Circuit board design for PCB printing', description: 'Custom PCBs using Altium Designer.', whatINeed: 'PCB manufacturing (up to 10 boards)', whatIOffer: 'Custom PCB design in Altium Designer', category: 'Services', tags: 'pcb,altium,electronics', status: 'ACTIVE' },
    { userId: users[5].id, title: 'Resume writing for LinkedIn optimization', description: 'ATS optimized tech resume.', whatINeed: 'LinkedIn profile complete makeover', whatIOffer: 'ATS-optimized tech resume', category: 'Services', tags: 'resume,linkedin,career', status: 'ACTIVE' },
    { userId: users[4].id, title: 'Ride share: LUMS to Lahore Airport', description: 'I drive to the airport every Friday.', whatINeed: 'Reserved parking spot near SSE building', whatIOffer: 'Weekly ride to Lahore Airport', category: 'Transportation', tags: 'ride,airport,parking', status: 'ACTIVE' },
    { userId: users[7].id, title: 'Web scraping script for data cleaning', description: 'Python web scrapers for any website.', whatINeed: 'Data cleaning & Power BI dashboard', whatIOffer: 'Custom Python web scraper', category: 'Services', tags: 'python,scraping,powerbi', status: 'ACTIVE' },
  ];

  const posts: { id: string }[] = [];
  for (const p of postsData) {
    const id = uuid();
    const daysAgo = Math.floor(Math.random() * 14);
    const created = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    await db.execute`
      INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, category, tags,
                         status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${p.userId}, ${p.title}, ${p.description}, ${p.whatINeed}, ${p.whatIOffer},
              ${p.category}, ${p.tags}, ${p.status}, 1, ${inAMonth}, 0, ${created}, ${created})
    `;
    posts.push({ id });
  }
  console.log(`   ✅ Created ${posts.length} posts`);

  // ─── Create Offers ───
  console.log('🤝 Creating offers...');
  const offersData = [
    { postId: posts[0].id, userId: users[2].id, proposalDescription: "I have Lay's Linear Algebra 6th edition. Almost new!", status: 'PENDING' },
    { postId: posts[0].id, userId: users[5].id, proposalDescription: "I have Strang's Introduction to Linear Algebra.", counterExchange: 'Would also love any Discrete Math book', status: 'PENDING' },
    { postId: posts[1].id, userId: users[8].id, proposalDescription: "I'm a design student! Can teach Figma and color theory.", status: 'PENDING' },
    { postId: posts[1].id, userId: users[7].id, proposalDescription: 'I know Figma well and can do 5 sessions.', status: 'ACCEPTED' },
    { postId: posts[2].id, userId: users[9].id, proposalDescription: 'I have a Raspberry Pi 4 (4GB RAM) barely used.', status: 'ACCEPTED' },
    { postId: posts[3].id, userId: users[1].id, proposalDescription: 'I have Kotler Marketing Management notes.', status: 'PENDING' },
    { postId: posts[4].id, userId: users[7].id, proposalDescription: 'I can build React Native apps!', status: 'PENDING' },
    { postId: posts[5].id, userId: users[3].id, proposalDescription: 'I have 60 prepared botany slides.', status: 'PENDING' },
    { postId: posts[6].id, userId: users[2].id, proposalDescription: "I'm great at DSA!", status: 'PENDING' },
    { postId: posts[7].id, userId: users[4].id, proposalDescription: 'I have a barely used Copic marker set (24 colors).', status: 'PENDING' },
    { postId: posts[9].id, userId: users[3].id, proposalDescription: 'I have complete OOP Java notes.', status: 'PENDING' },
    { postId: posts[10].id, userId: users[5].id, proposalDescription: "I have $75 in GCP credits from a hackathon.", status: 'PENDING' },
  ];

  const offers: { id: string }[] = [];
  for (const o of offersData) {
    const id = uuid();
    await db.execute`
      INSERT INTO offers (id, postId, userId, proposalDescription, counterExchange, status, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${o.postId}, ${o.userId}, ${o.proposalDescription}, ${(o as any).counterExchange ?? null},
              ${o.status}, 0, ${now}, ${now})
    `;
    offers.push({ id });
  }
  console.log(`   ✅ Created ${offers.length} offers`);

  // ─── Create Transactions ───
  console.log('🔄 Creating transactions...');
  const tx1Id = uuid();
  await db.execute`
    INSERT INTO transactions (id, postId, offerId, requesterId, offererId, status,
      requesterDone, offererDone, requesterCancel, offererCancel, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${tx1Id}, ${posts[1].id}, ${offers[3].id}, ${users[2].id}, ${users[7].id},
            'IN_PROGRESS', 0, 0, 0, 0, ${inAMonth}, 0, ${now}, ${now})
  `;
  await db.execute`UPDATE posts SET status = 'IN_PROGRESS', updatedAt = ${now} WHERE id = ${posts[1].id}`;

  const completedAt2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tx2Id = uuid();
  await db.execute`
    INSERT INTO transactions (id, postId, offerId, requesterId, offererId, status,
      requesterDone, offererDone, requesterCancel, offererCancel, completedAt, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${tx2Id}, ${posts[2].id}, ${offers[4].id}, ${users[3].id}, ${users[9].id},
            'SUCCESSFUL', 1, 1, 0, 0, ${completedAt2}, ${inAMonth}, 0, ${now}, ${now})
  `;
  await db.execute`UPDATE posts SET status = 'SUCCESSFUL', updatedAt = ${now} WHERE id = ${posts[2].id}`;

  // Historical completed
  const histPost1Id = uuid();
  const histCreated1 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  await db.execute`
    INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, category, tags,
                       status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${histPost1Id}, ${users[5].id}, 'Algorithm textbook exchange', 'CLRS for Skiena',
            'Skiena Algorithm Design Manual', 'CLRS Introduction to Algorithms', 'Textbooks', 'algorithms',
            'SUCCESSFUL', 1, ${inAMonth}, 0, ${histCreated1}, ${histCreated1})
  `;
  const histOffer1Id = uuid();
  await db.execute`
    INSERT INTO offers (id, postId, userId, proposalDescription, status, isDeleted, createdAt, updatedAt)
    VALUES (${histOffer1Id}, ${histPost1Id}, ${users[1].id}, 'I have Skiena!', 'ACCEPTED', 0, ${now}, ${now})
  `;
  const tx3Id = uuid();
  const tx3Created = new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000);
  const tx3Completed = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  await db.execute`
    INSERT INTO transactions (id, postId, offerId, requesterId, offererId, status,
      requesterDone, offererDone, requesterCancel, offererCancel, completedAt, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${tx3Id}, ${histPost1Id}, ${histOffer1Id}, ${users[5].id}, ${users[1].id},
            'SUCCESSFUL', 1, 1, 0, 0, ${tx3Completed}, ${inAMonth}, 0, ${tx3Created}, ${tx3Created})
  `;

  // Historical cancelled
  const histPost2Id = uuid();
  const histCreated2 = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
  await db.execute`
    INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, category, tags,
                       status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${histPost2Id}, ${users[1].id}, 'Physics lab report for Chemistry help', 'Need help with organic chem',
            'Organic Chemistry tutoring', 'Physics lab report template', 'Tutoring', 'physics,chemistry',
            'CANCELLED', 1, ${inAMonth}, 0, ${histCreated2}, ${histCreated2})
  `;
  const histOffer2Id = uuid();
  await db.execute`
    INSERT INTO offers (id, postId, userId, proposalDescription, status, isDeleted, createdAt, updatedAt)
    VALUES (${histOffer2Id}, ${histPost2Id}, ${users[6].id}, 'I can help with organic chem!', 'ACCEPTED', 0, ${now}, ${now})
  `;
  const tx4Id = uuid();
  const tx4Created = new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000);
  const tx4Cancelled = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  await db.execute`
    INSERT INTO transactions (id, postId, offerId, requesterId, offererId, status,
      requesterDone, offererDone, requesterCancel, offererCancel, cancelledAt, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${tx4Id}, ${histPost2Id}, ${histOffer2Id}, ${users[1].id}, ${users[6].id},
            'CANCELLED', 0, 0, 1, 0, ${tx4Cancelled}, ${inAMonth}, 0, ${tx4Created}, ${tx4Created})
  `;
  console.log('   ✅ Created 4 transactions');

  // ─── Create Messages ───
  console.log('💬 Creating messages...');
  const messagesData = [
    { transactionId: tx1Id, senderId: users[2].id, content: 'Hey! Excited to start the tutoring exchange!', messageType: 'TEXT' },
    { transactionId: tx1Id, senderId: users[7].id, content: 'Same here! When would you like to have the first session?', messageType: 'TEXT' },
    { transactionId: tx1Id, senderId: users[2].id, content: 'How about Thursday at 3 PM in the library?', messageType: 'TEXT' },
    { transactionId: tx1Id, senderId: users[7].id, content: 'Perfect! I will bring my laptop with Figma ready.', messageType: 'TEXT' },
    { transactionId: tx1Id, senderId: users[2].id, content: 'Can you start with the basics of auto-layout and components?', messageType: 'TEXT' },
    { transactionId: tx1Id, senderId: users[7].id, content: 'Absolutely! I will prepare a mini project we can build together.', messageType: 'TEXT' },
    { transactionId: tx2Id, senderId: users[3].id, content: 'Got your Raspberry Pi! It is in perfect condition.', messageType: 'TEXT' },
    { transactionId: tx2Id, senderId: users[9].id, content: 'Great! The Arduino kit is amazing.', messageType: 'TEXT' },
    { transactionId: tx2Id, senderId: users[3].id, content: 'Glad to hear it! Let me mark this as complete.', messageType: 'TEXT' },
    { transactionId: tx2Id, senderId: users[0].id, content: 'Transaction marked as complete by both parties.', messageType: 'SYSTEM' },
    { transactionId: tx3Id, senderId: users[5].id, content: 'Got the Skiena book, thanks!', messageType: 'TEXT' },
    { transactionId: tx3Id, senderId: users[1].id, content: 'CLRS is in great condition. Happy trading!', messageType: 'TEXT' },
  ];

  for (let i = 0; i < messagesData.length; i++) {
    const m = messagesData[i];
    const id = uuid();
    const minutesAgo = (messagesData.length - i) * 15;
    const created = new Date(now.getTime() - minutesAgo * 60 * 1000);
    await db.execute`
      INSERT INTO messages (id, transactionId, senderId, content, messageType, isRead, isDeleted, createdAt)
      VALUES (${id}, ${m.transactionId}, ${m.senderId}, ${m.content}, ${m.messageType}, 0, 0, ${created})
    `;
  }
  console.log(`   ✅ Created ${messagesData.length} messages`);

  // ─── Create Ratings ───
  console.log('⭐ Creating ratings...');
  const ratingsData = [
    { transactionId: tx2Id, giverId: users[3].id, receiverId: users[9].id, score: 5, review: 'Amazing trade! Raspberry Pi was in perfect condition.' },
    { transactionId: tx2Id, giverId: users[9].id, receiverId: users[3].id, score: 5, review: 'Ahmed is very trustworthy. Arduino kit had everything as described.' },
    { transactionId: tx3Id, giverId: users[5].id, receiverId: users[1].id, score: 4, review: 'Good trade. Book was in decent condition.' },
    { transactionId: tx3Id, giverId: users[1].id, receiverId: users[5].id, score: 5, review: 'Javad is excellent! Skiena book was pristine.' },
  ];

  for (const r of ratingsData) {
    const id = uuid();
    await db.execute`
      INSERT INTO ratings (id, transactionId, giverId, receiverId, score, review, isDeleted, createdAt)
      VALUES (${id}, ${r.transactionId}, ${r.giverId}, ${r.receiverId}, ${r.score}, ${r.review}, 0, ${now})
    `;
  }
  console.log(`   ✅ Created ${ratingsData.length} ratings`);

  // ─── Create Report ───
  console.log('🚨 Creating reports...');
  const reportId = uuid();
  await db.execute`
    INSERT INTO reports (id, transactionId, reporterId, targetUserId, reason, description, status, isDeleted, createdAt, updatedAt)
    VALUES (${reportId}, ${tx4Id}, ${users[6].id}, ${users[1].id}, 'Unresponsive',
            'The requester cancelled without communication.', 'PENDING', 0, ${now}, ${now})
  `;
  console.log('   ✅ Created 1 report');

  // ─── Create Notifications ───
  console.log('🔔 Creating notifications...');
  const notifsData = [
    { userId: users[1].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Sarah Chen made an offer on your post', isRead: true },
    { userId: users[1].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Javad Khan made an offer on your post', isRead: true },
    { userId: users[2].id, type: 'OFFER_ACCEPTED', title: 'Offer accepted!', message: 'Your offer was accepted', isRead: true },
    { userId: users[3].id, type: 'TRANSACTION_COMPLETE', title: 'Transaction completed', message: 'Your exchange is now complete!', isRead: false },
    { userId: users[5].id, type: 'SYSTEM', title: 'Welcome to AlchEx!', message: 'Start trading by creating a post.', isRead: false },
    { userId: users[7].id, type: 'MESSAGE', title: 'New message', message: 'Sarah Chen sent you a message', isRead: false },
    { userId: users[2].id, type: 'SYSTEM', title: 'Reputation milestone!', message: 'You have reached 90+ reputation score.', isRead: false },
    { userId: users[9].id, type: 'OFFER_RECEIVED', title: 'New offer received', message: 'Someone made an offer on your 3D printing post', isRead: false },
  ];

  for (let i = 0; i < notifsData.length; i++) {
    const n = notifsData[i];
    const id = uuid();
    const created = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
    await db.execute`
      INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
      VALUES (${id}, ${n.userId}, ${n.type}, ${n.title}, ${n.message}, ${n.isRead ? 1 : 0}, ${created})
    `;
  }
  console.log(`   ✅ Created ${notifsData.length} notifications`);

  // ─── Leaderboard Snapshots ───
  console.log('🏆 Creating leaderboard snapshots...');
  const sortedUsers = [...users].sort((a, b) => b.reputationScore - a.reputationScore);
  for (let i = 0; i < sortedUsers.length; i++) {
    const id = uuid();
    const avgRating = +(3.5 + Math.random() * 1.5).toFixed(2);
    await db.execute`
      INSERT INTO leaderboard_snapshots (id, userId, [rank], reputationScore, totalExchanges, averageRating, period, snapshotDate, createdAt)
      VALUES (${id}, ${sortedUsers[i].id}, ${i + 1}, ${sortedUsers[i].reputationScore},
              ${sortedUsers[i].totalExchanges}, ${avgRating}, 'ALL_TIME', ${now}, ${now})
    `;
  }
  console.log(`   ✅ Created ${sortedUsers.length} leaderboard entries`);

  console.log('\n✨ Seeding complete!');
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@alchex.io / Test@1234');
  console.log('   Demo:  demo@university.edu / Test@1234');
  console.log('   All users share password: Test@1234');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => db.disconnect());
