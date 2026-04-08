const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔄 Syncing database...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Campagne" 
      ADD COLUMN IF NOT EXISTS "dateScheduled" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "clientId" INTEGER REFERENCES "Client"(id)
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Segment" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        criteria TEXT NOT NULL,
        "clientId" INTEGER REFERENCES "Client"(id),
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ContactSegment" (
        id SERIAL PRIMARY KEY,
        "contactId" INTEGER REFERENCES "Contact"(id),
        "segmentId" INTEGER REFERENCES "Segment"(id)
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CampagneStats" (
        id SERIAL PRIMARY KEY,
        "campagneId" INTEGER UNIQUE REFERENCES "Campagne"(id),
        "emailsSent" INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Database synced!')
  } catch (err) {
    console.log('DB sync:', err.message)
  } finally {
    await prisma.$disconnect()
  }
  require('./server.js')
}

main()