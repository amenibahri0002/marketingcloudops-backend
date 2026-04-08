const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Client TechEventCo
  const client = await prisma.client.upsert({
    where: { email: 'admin@techeventco.com' },
    update: {},
    create: { name: 'TechEventCo', email: 'admin@techeventco.com' }
  });

  // Admin user
  const hashed = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@techeventco.com' },
    update: {},
    create: {
      name: 'Admin TechEventCo', email: 'admin@techeventco.com',
      password: hashed, role: 'ADMIN', clientId: client.id
    }
  });

  // Événement Conférence IA 2026
  const event = await prisma.event.upsert({
    where: { id: 'conf-ia-2026' },
    update: {},
    create: {
      id: 'conf-ia-2026',
      title: 'Conférence IA 2026',
      description: 'Le grand rendez-vous de l\'intelligence artificielle en Tunisie.',
      date: new Date('2026-04-01T10:00:00'),
      location: 'Tunis, Lac 2',
      price: 99,
      capacity: 500,
      clientId: client.id
    }
  });

  console.log('✅ Seed terminé !');
  console.log('   Client :', client.name);
  console.log('   Événement :', event.title);
  console.log('   Login : admin@techeventco.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());