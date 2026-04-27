import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import db from '../db/connection';

function uuid() { return crypto.randomUUID(); }

async function ensureCategory(name: string): Promise<number> {
  await db.execute`IF NOT EXISTS (SELECT 1 FROM categories WHERE name=${name}) INSERT INTO categories(name) VALUES(${name})`;
  const r: any[] = await db.query`SELECT id FROM categories WHERE name=${name}`;
  return r[0].id;
}

async function ensureUniversity(name: string, campus: string): Promise<number> {
  await db.execute`IF NOT EXISTS (SELECT 1 FROM universities WHERE name=${name} AND campus=${campus}) INSERT INTO universities(name,campus) VALUES(${name},${campus})`;
  const r: any[] = await db.query`SELECT id FROM universities WHERE name=${name} AND campus=${campus}`;
  return r[0].id;
}

async function ensureProgram(name: string): Promise<number> {
  await db.execute`IF NOT EXISTS (SELECT 1 FROM programs WHERE name=${name}) INSERT INTO programs(name) VALUES(${name})`;
  const r: any[] = await db.query`SELECT id FROM programs WHERE name=${name}`;
  return r[0].id;
}

async function ensureTag(name: string): Promise<number> {
  await db.execute`IF NOT EXISTS (SELECT 1 FROM tags WHERE name=${name}) INSERT INTO tags(name) VALUES(${name})`;
  const r: any[] = await db.query`SELECT id FROM tags WHERE name=${name}`;
  return r[0].id;
}

async function main() {
  console.log('🧪 Seeding AlchEx database (BCNF) with dummy data...\n');

  // ─── Clean existing data (order matters for FK constraints) ───
  console.log('🗑️  Cleaning existing data...');
  await db.execute`DELETE FROM notifications`;
  await db.execute`DELETE FROM leaderboard_snapshots`;
  await db.execute`DELETE FROM report_evidence`;
  await db.execute`DELETE FROM reports`;
  await db.execute`DELETE FROM ratings`;
  await db.execute`DELETE FROM messages`;
  await db.execute`DELETE FROM transactions`;
  await db.execute`DELETE FROM offers`;
  await db.execute`DELETE FROM post_tags`;
  await db.execute`DELETE FROM posts`;
  await db.execute`DELETE FROM user_social_links`;
  await db.execute`DELETE FROM users`;
  await db.execute`DELETE FROM tags`;
  await db.execute`DELETE FROM categories`;
  await db.execute`DELETE FROM programs`;
  await db.execute`DELETE FROM universities`;

  // ─── Create Users ───
  console.log('👥 Creating users...');
  const password = await bcrypt.hash('Test@1234', 12);
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const usersData = [
    { email: 'admin@alchex.io', firstName: 'Admin', lastName: 'AlchEx', role: 'ADMIN', university: 'NUST', campus: 'H-12', program: 'CS', batch: '2024', bio: 'Platform administrator', rep: 100, ex: 50 },
    { email: 'demo@university.edu', firstName: 'Demo', lastName: 'User', role: 'ADMIN', university: 'NUST', campus: 'H-12', program: 'SE', batch: '2023', bio: 'Full-stack developer and avid reader', rep: 85, ex: 32 },
    { email: 'sarah@university.edu', firstName: 'Sarah', lastName: 'Chen', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'CS', batch: '2024', bio: 'ML enthusiast.', rep: 92, ex: 41 },
    { email: 'ahmed@university.edu', firstName: 'Ahmed', lastName: 'Raza', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'EE', batch: '2023', bio: 'Electronics wizard.', rep: 78, ex: 28 },
    { email: 'maria@university.edu', firstName: 'Maria', lastName: 'Garcia', role: 'STUDENT', university: 'LUMS', campus: 'Main', program: 'BBA', batch: '2024', bio: 'Business student.', rep: 65, ex: 19 },
    { email: 'javad@university.edu', firstName: 'Javad', lastName: 'Khan', role: 'STUDENT', university: 'FAST', campus: 'Islamabad', program: 'CS', batch: '2022', bio: 'Senior dev.', rep: 95, ex: 55 },
    { email: 'zara@university.edu', firstName: 'Zara', lastName: 'Ali', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'BIO', batch: '2024', bio: 'Biotech student.', rep: 45, ex: 10 },
    { email: 'omar@university.edu', firstName: 'Omar', lastName: 'Farooq', role: 'STUDENT', university: 'COMSATS', campus: 'Islamabad', program: 'SE', batch: '2023', bio: 'Freelancer + student.', rep: 72, ex: 25 },
    { email: 'hina@university.edu', firstName: 'Hina', lastName: 'Malik', role: 'STUDENT', university: 'NUST', campus: 'H-12', program: 'ARCH', batch: '2024', bio: 'Architecture student.', rep: 58, ex: 14 },
    { email: 'ali@university.edu', firstName: 'Ali', lastName: 'Hassan', role: 'STUDENT', university: 'GIKI', campus: 'Topi', program: 'ME', batch: '2023', bio: '3D printing enthusiast.', rep: 88, ex: 38 },
  ];

  const users: { id: string; rep: number; ex: number }[] = [];
  for (const u of usersData) {
    const id = uuid();
    const uniId = await ensureUniversity(u.university, u.campus);
    const progId = await ensureProgram(u.program);
    await db.execute`
      INSERT INTO users (id, email, passwordHash, firstName, lastName, role, universityId, programId, batch, section, bio,
                         reputationScore, totalExchanges, emailVerified, isBanned, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${u.email}, ${password}, ${u.firstName}, ${u.lastName}, ${u.role}, ${uniId}, ${progId},
              ${u.batch}, ${'A'}, ${u.bio}, ${u.rep}, ${u.ex}, 1, 0, 0, ${now}, ${now})
    `;
    users.push({ id, rep: u.rep, ex: u.ex });
  }
  console.log(`   ✅ Created ${users.length} users`);

  // ─── Create Posts ───
  console.log('📝 Creating posts...');
  const postsData = [
    { userId: users[1].id, title: 'Trading Calculus Textbook for Linear Algebra', desc: 'Stewart Calculus 8th ed.', need: 'Linear Algebra textbook', offer: 'Stewart Calculus 8th Edition', cat: 'Textbooks', tags: 'math,calculus' },
    { userId: users[2].id, title: 'Python tutoring for web design help', desc: 'I can teach Python, NumPy, Pandas.', need: 'Figma/UI/UX design tutoring', offer: 'Python + ML tutoring', cat: 'Tutoring', tags: 'python,ml,figma' },
    { userId: users[3].id, title: 'Arduino Mega 2560 + sensors bundle', desc: 'Full Arduino kit.', need: 'Raspberry Pi 4', offer: 'Arduino Mega 2560 + 20 sensors', cat: 'Electronics', tags: 'arduino,raspberry-pi' },
    { userId: users[4].id, title: 'FA notes for Marketing notes', desc: 'Complete semester notes.', need: 'Marketing Management notes', offer: 'Financial Accounting notes', cat: 'Notes', tags: 'accounting,marketing' },
    { userId: users[5].id, title: 'Full-stack web project for mobile app', desc: 'Complete MERN stack app.', need: 'React Native mobile app', offer: 'Full-stack MERN web application', cat: 'Services', tags: 'mern,react-native' },
    { userId: users[6].id, title: 'Looking for microscope slides', desc: 'Need slides for botany lab.', need: 'Prepared microscope slides', offer: 'Organic Chemistry lab manual', cat: 'Lab Equipment', tags: 'biology,chemistry' },
    { userId: users[7].id, title: 'Logo design for assignment help', desc: 'Professional logo designer.', need: 'Help with DSA assignment', offer: 'Logo + brand identity package', cat: 'Services', tags: 'design,dsa' },
    { userId: users[8].id, title: 'Architecture model supplies trade', desc: 'Extra bass wood and foam board.', need: 'Copic markers or watercolors', offer: 'Bass wood + foam board + tools', cat: 'Other', tags: 'architecture,art' },
    { userId: users[9].id, title: '3D printing service for CAD modeling', desc: 'Professional 3D printer access.', need: 'SolidWorks CAD modeling', offer: '3D printing service', cat: 'Services', tags: '3d-printing,cad' },
    { userId: users[1].id, title: 'DSA course materials for OOP notes', desc: 'Complete DSA course pack.', need: 'OOP Java complete materials', offer: 'DSA complete course pack', cat: 'Notes', tags: 'dsa,oop,java' },
    { userId: users[2].id, title: 'GPU rental for cloud credits', desc: 'RTX 3080 for ML training.', need: '$50+ AWS/GCP cloud credits', offer: 'RTX 3080 access for 1 week', cat: 'Electronics', tags: 'gpu,cloud,ml' },
    { userId: users[5].id, title: 'Resume writing for LinkedIn optimization', desc: 'ATS optimized resume.', need: 'LinkedIn profile makeover', offer: 'ATS-optimized tech resume', cat: 'Services', tags: 'resume,linkedin' },
    { userId: users[4].id, title: 'Ride share: LUMS to Lahore Airport', desc: 'Weekly airport rides.', need: 'Reserved parking spot near SSE', offer: 'Weekly ride to Lahore Airport', cat: 'Transportation', tags: 'ride,airport' },
    { userId: users[7].id, title: 'Web scraping script for data cleaning', desc: 'Python web scrapers.', need: 'Data cleaning & Power BI dashboard', offer: 'Custom Python web scraper', cat: 'Services', tags: 'python,scraping' },
    { userId: users[3].id, title: 'Circuit board design for PCB printing', desc: 'Custom PCBs using Altium.', need: 'PCB manufacturing', offer: 'Custom PCB design in Altium', cat: 'Services', tags: 'pcb,altium' },
  ];

  const posts: { id: string }[] = [];
  for (const p of postsData) {
    const id = uuid();
    const catId = await ensureCategory(p.cat);
    const daysAgo = Math.floor(Math.random() * 14);
    const created = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    await db.execute`
      INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, categoryId,
                         status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${p.userId}, ${p.title}, ${p.desc}, ${p.need}, ${p.offer}, ${catId},
              'ACTIVE', 1, ${inAMonth}, 0, ${created}, ${created})
    `;
    // Insert tags
    for (const tagName of p.tags.split(',')) {
      const tagId = await ensureTag(tagName.trim());
      await db.execute`INSERT INTO post_tags (postId, tagId) VALUES (${id}, ${tagId})`;
    }
    posts.push({ id });
  }
  console.log(`   ✅ Created ${posts.length} posts`);

  // ─── Create Offers ───
  console.log('🤝 Creating offers...');
  const offersData = [
    { postId: posts[0].id, userId: users[2].id, desc: "I have Lay's Linear Algebra 6th edition!", st: 'PENDING' },
    { postId: posts[0].id, userId: users[5].id, desc: "I have Strang's Introduction to Linear Algebra.", st: 'PENDING' },
    { postId: posts[1].id, userId: users[8].id, desc: "I'm a design student! Can teach Figma.", st: 'PENDING' },
    { postId: posts[1].id, userId: users[7].id, desc: 'I know Figma well and can do 5 sessions.', st: 'ACCEPTED' },
    { postId: posts[2].id, userId: users[9].id, desc: 'I have a Raspberry Pi 4 (4GB RAM).', st: 'ACCEPTED' },
    { postId: posts[3].id, userId: users[1].id, desc: 'I have Kotler Marketing Management notes.', st: 'PENDING' },
    { postId: posts[4].id, userId: users[7].id, desc: 'I can build React Native apps!', st: 'PENDING' },
    { postId: posts[5].id, userId: users[3].id, desc: 'I have 60 prepared botany slides.', st: 'PENDING' },
    { postId: posts[6].id, userId: users[2].id, desc: "I'm great at DSA!", st: 'PENDING' },
    { postId: posts[7].id, userId: users[4].id, desc: 'I have a Copic marker set (24 colors).', st: 'PENDING' },
    { postId: posts[9].id, userId: users[3].id, desc: 'I have complete OOP Java notes.', st: 'PENDING' },
    { postId: posts[10].id, userId: users[5].id, desc: "I have $75 in GCP credits.", st: 'PENDING' },
  ];

  const offers: { id: string }[] = [];
  for (const o of offersData) {
    const id = uuid();
    await db.execute`
      INSERT INTO offers (id, postId, userId, proposalDescription, status, isDeleted, createdAt, updatedAt)
      VALUES (${id}, ${o.postId}, ${o.userId}, ${o.desc}, ${o.st}, 0, ${now}, ${now})
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
  await db.execute`UPDATE posts SET status='IN_PROGRESS', updatedAt=${now} WHERE id=${posts[1].id}`;

  const completedAt2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tx2Id = uuid();
  await db.execute`
    INSERT INTO transactions (id, postId, offerId, requesterId, offererId, status,
      requesterDone, offererDone, requesterCancel, offererCancel, completedAt, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${tx2Id}, ${posts[2].id}, ${offers[4].id}, ${users[3].id}, ${users[9].id},
            'SUCCESSFUL', 1, 1, 0, 0, ${completedAt2}, ${inAMonth}, 0, ${now}, ${now})
  `;
  await db.execute`UPDATE posts SET status='SUCCESSFUL', updatedAt=${now} WHERE id=${posts[2].id}`;

  // Historical completed
  const histPost1Id = uuid();
  const histCreated1 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const catId = await ensureCategory('Textbooks');
  await db.execute`
    INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, categoryId,
                       status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${histPost1Id}, ${users[5].id}, 'Algorithm textbook exchange', 'CLRS for Skiena',
            'Skiena Algorithm Design Manual', 'CLRS Introduction to Algorithms', ${catId},
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
  const catId2 = await ensureCategory('Tutoring');
  await db.execute`
    INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, categoryId,
                       status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
    VALUES (${histPost2Id}, ${users[1].id}, 'Physics lab report for Chemistry help', 'Need organic chem help',
            'Organic Chemistry tutoring', 'Physics lab report template', ${catId2},
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

  // ─── Messages ───
  console.log('💬 Creating messages...');
  const msgs = [
    { txId: tx1Id, sender: users[2].id, content: 'Hey! Excited to start the tutoring exchange!' },
    { txId: tx1Id, sender: users[7].id, content: 'Same here! When for the first session?' },
    { txId: tx1Id, sender: users[2].id, content: 'Thursday 3 PM in the library?' },
    { txId: tx1Id, sender: users[7].id, content: 'Perfect! I will bring my laptop with Figma.' },
    { txId: tx2Id, sender: users[3].id, content: 'Got your Raspberry Pi! Perfect condition.' },
    { txId: tx2Id, sender: users[9].id, content: 'Great! The Arduino kit is amazing.' },
    { txId: tx3Id, sender: users[5].id, content: 'Got the Skiena book, thanks!' },
    { txId: tx3Id, sender: users[1].id, content: 'CLRS is great. Happy trading!' },
  ];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    const created = new Date(now.getTime() - (msgs.length - i) * 15 * 60 * 1000);
    await db.execute`
      INSERT INTO messages (id, transactionId, senderId, content, messageType, isRead, isDeleted, createdAt)
      VALUES (${uuid()}, ${m.txId}, ${m.sender}, ${m.content}, 'TEXT', 0, 0, ${created})
    `;
  }
  console.log(`   ✅ Created ${msgs.length} messages`);

  // ─── Ratings ───
  console.log('⭐ Creating ratings...');
  const ratings = [
    { txId: tx2Id, giver: users[3].id, receiver: users[9].id, score: 5, review: 'Amazing trade!' },
    { txId: tx2Id, giver: users[9].id, receiver: users[3].id, score: 5, review: 'Trustworthy partner.' },
    { txId: tx3Id, giver: users[5].id, receiver: users[1].id, score: 4, review: 'Good trade.' },
    { txId: tx3Id, giver: users[1].id, receiver: users[5].id, score: 5, review: 'Excellent!' },
  ];
  for (const r of ratings) {
    await db.execute`
      INSERT INTO ratings (id, transactionId, giverId, receiverId, score, review, isDeleted, createdAt)
      VALUES (${uuid()}, ${r.txId}, ${r.giver}, ${r.receiver}, ${r.score}, ${r.review}, 0, ${now})
    `;
  }
  console.log(`   ✅ Created ${ratings.length} ratings`);

  // ─── Report ───
  console.log('🚨 Creating reports...');
  await db.execute`
    INSERT INTO reports (id, transactionId, reporterId, targetUserId, reason, description, status, isDeleted, createdAt, updatedAt)
    VALUES (${uuid()}, ${tx4Id}, ${users[6].id}, ${users[1].id}, 'Unresponsive',
            'The requester cancelled without communication.', 'PENDING', 0, ${now}, ${now})
  `;
  console.log('   ✅ Created 1 report');

  // ─── Notifications ───
  console.log('🔔 Creating notifications...');
  const notifs = [
    { userId: users[1].id, type: 'OFFER_RECEIVED', title: 'New offer received', msg: 'Sarah Chen made an offer' },
    { userId: users[2].id, type: 'OFFER_ACCEPTED', title: 'Offer accepted!', msg: 'Your offer was accepted' },
    { userId: users[3].id, type: 'TRANSACTION_COMPLETE', title: 'Transaction completed', msg: 'Exchange complete!' },
    { userId: users[5].id, type: 'SYSTEM', title: 'Welcome to AlchEx!', msg: 'Start by creating a post.' },
    { userId: users[7].id, type: 'MESSAGE', title: 'New message', msg: 'Sarah Chen sent you a message' },
  ];
  for (let i = 0; i < notifs.length; i++) {
    const n = notifs[i];
    const created = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
    await db.execute`
      INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
      VALUES (${uuid()}, ${n.userId}, ${n.type}, ${n.title}, ${n.msg}, 0, ${created})
    `;
  }
  console.log(`   ✅ Created ${notifs.length} notifications`);

  // ─── Leaderboard Snapshots ───
  console.log('🏆 Creating leaderboard snapshots...');
  const sorted = [...users].sort((a, b) => b.rep - a.rep);
  for (let i = 0; i < sorted.length; i++) {
    const avg = +(3.5 + Math.random() * 1.5).toFixed(2);
    await db.execute`
      INSERT INTO leaderboard_snapshots (id, userId, [rank], reputationScore, totalExchanges, averageRating, period, snapshotDate, createdAt)
      VALUES (${uuid()}, ${sorted[i].id}, ${i + 1}, ${sorted[i].rep}, ${sorted[i].ex}, ${avg}, 'ALL_TIME', ${now}, ${now})
    `;
  }
  console.log(`   ✅ Created ${sorted.length} leaderboard entries`);

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
