const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET état des services
router.get('/health', async (req, res) => {
  try {
    const alertes = []
    
    // Vérifier la base de données
    try {
      await prisma.$queryRaw`SELECT 1`
      alertes.push({ service: 'Database', status: 'ok', message: 'Connectée' })
    } catch (err) {
      alertes.push({ service: 'Database', status: 'error', message: 'Déconnectée' })
    }

    // Vérifier les campagnes en attente
    const campagnesEnAttente = await prisma.campagne.count({ where: { status: 'scheduled' } })
    alertes.push({ service: 'Campagnes', status: campagnesEnAttente > 0 ? 'warning' : 'ok', message: campagnesEnAttente + ' campagne(s) planifiée(s)' })

    // Stats générales
    const totalClients = await prisma.client.count()
    const totalContacts = await prisma.contact.count()
    const totalCampagnes = await prisma.campagne.count()

    res.json({
      status: 'ok',
      timestamp: new Date(),
      alertes,
      stats: { totalClients, totalContacts, totalCampagnes }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message })
  }
})

module.exports = router