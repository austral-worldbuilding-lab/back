import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create roles if they don't exist
  // Level: lower number = higher privilege
  const roles = [
    { name: 'dueño', level: 1 },
    { name: 'facilitador', level: 2 },
    { name: 'worldbuilder', level: 3 },
    { name: 'lector', level: 4 },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { level: role.level },
      create: { name: role.name, level: role.level },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });