import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const roles = ['owner', 'member'];
  console.log('📝 Seeding roles:', roles);

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Roles seeded successfully');

  // Seed some example tags with different colors
  const tags = [
    { name: 'Comedor' },
    { name: 'Cocina' },
    { name: 'Dormitorio' },
    { name: 'Baño' },
    { name: 'Sala' },
  ];
  console.log('📝 Seeding tags');

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { name: tag.name },
      create: { name: tag.name },
    });
  }
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
