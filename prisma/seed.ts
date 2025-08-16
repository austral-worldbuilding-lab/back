import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const roles = ['owner', 'admin', 'member', 'viewer'];
  console.log('📝 Seeding roles:', roles);

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Roles seeded successfully');

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((e) => {
      console.error('❌ Error disconnecting Prisma:', e);
      process.exit(1);
    });
  });
