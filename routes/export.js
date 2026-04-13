const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { Parser } = require('json2csv')
const prisma = new PrismaClient()

// Export contacts CSV
router.get('/contacts', async (req, res) => {
  try {
    const user = req.user
    const where = user.role === 'ADMIN' ? {} : { clientId: user.clientId }

    const contacts = await prisma.contact.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    })

    const data = contacts.map(c => ({
      Nom: c.name,
      Email: c.email,
      Telephone: c.phone,
      Client: c.client?.name || '',
      Date: new Date(c.createdAt).toLocaleDateString('fr-FR')
    }))

    const parser = new Parser({ fields: ['Nom', 'Email', 'Telephone', 'Client', 'Date'] })
    const csv = parser.parse(data)

    res.header('Content-Type', 'text/csv')
    res.header('Content-Disposition', 'attachment; filename=contacts.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Export campagnes CSV
router.get('/campagnes', async (req, res) => {
  try {
    const user = req.user
    const where = user.role === 'ADMIN' ? {} : { clientId: user.clientId }

    const campagnes = await prisma.campagne.findMany({
      where,
      include: { client: true, stats: true },
      orderBy: { createdAt: 'desc' }
    })

    const data = campagnes.map(c => ({
      Titre: c.title,
      Type: c.type,
      Status: c.status,
      Client: c.client?.name || '',
      EmailsEnvoyes: c.stats?.emailsSent || 0,
      Ouvertures: c.stats?.opens || 0,
      Clics: c.stats?.clicks || 0,
      Conversions: c.stats?.conversions || 0,
      Date: new Date(c.createdAt).toLocaleDateString('fr-FR')
    }))

    const parser = new Parser({
      fields: ['Titre', 'Type', 'Status', 'Client', 'EmailsEnvoyes', 'Ouvertures', 'Clics', 'Conversions', 'Date']
    })
    const csv = parser.parse(data)

    res.header('Content-Type', 'text/csv')
    res.header('Content-Disposition', 'attachment; filename=campagnes.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Export inscriptions CSV
router.get('/inscriptions', async (req, res) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const data = inscriptions.map(i => ({
      Nom: i.name,
      Email: i.email,
      Telephone: i.phone,
      Date: new Date(i.createdAt).toLocaleDateString('fr-FR')
    }))

    const parser = new Parser({ fields: ['Nom', 'Email', 'Telephone', 'Date'] })
    const csv = parser.parse(data)

    res.header('Content-Type', 'text/csv')
    res.header('Content-Disposition', 'attachment; filename=inscriptions.csv')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router