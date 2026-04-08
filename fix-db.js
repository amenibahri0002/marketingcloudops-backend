const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Campagne" 
      ADD COLUMN IF NOT EXISTS "dateScheduled" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "clientId" INTEGER REFERENCES "Client"(id)
    `)
    console.log('✅ Colonnes ajoutées avec succès !')
  } catch (err) {
    console.log('Erreur:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

fix()