import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = ['owner', 'member'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Seed some example tags with different colors
  const tags = [
    { name: 'Comedor' },
    { name: 'Cocina' },
    { name: 'Dormitorio' },
    { name: 'Baño' },
    { name: 'Sala' },
  ];

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
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((e) => {
      console.error('Error disconnecting Prisma:', e);
    });
  });
