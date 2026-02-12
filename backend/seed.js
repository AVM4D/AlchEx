const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'demo@university.edu',
      passwordHash: '$2b$12$f7scfiuy/RTok7LhK004iu9Qvel6pV1mT0VjFqMhFIYiRCX.xhYF.',
      firstName: 'Alex',
      lastName: 'Alchemist',
      university: 'Demo University',
      role: 'ADMIN',
      emailVerified: true,
      reputationScore: 4.8,
      totalExchanges: 12,
    },
  });
  console.log('Created user:', user.id, user.email);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
