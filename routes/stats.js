const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const stats = await prisma.campagneStats.findMany({
      include: { campagne: { include: { client: true } } }
    })

    const statsWithROI = stats.map(s => {
      const tauxOuverture = s.emailsSent > 0 ? Math.round((s.opens / s.emailsSent) * 100) : 0
      const tauxClic = s.emailsSent > 0 ? Math.round((s.clicks / s.emailsSent) * 100) : 0
      const roi = s.conversions > 0 ? Math.round(((s.conversions * 99) / (s.emailsSent * 0.5)) * 100) : 0

      return {
        ...s,
        tauxOuverture,
        tauxClic,
        roi
      }
    })

    res.json(statsWithROI)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:campagneId', async (req, res) => {
  try {
    const stats = await prisma.campagneStats.findUnique({
      where: { campagneId: parseInt(req.params.campagneId) },
      include: { campagne: true }
    })
    if (!stats) return res.json({ emailsSent: 0, opens: 0, clicks: 0, conversions: 0, roi: 0 })

    const roi = stats.conversions > 0 ? Math.round(((stats.conversions * 99) / (stats.emailsSent * 0.5)) * 100) : 0

    res.json({ ...stats, roi })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:campagneId', async (req, res) => {
  try {
    const { opens, clicks, conversions } = req.body
    const stats = await prisma.campagneStats.upsert({
      where: { campagneId: parseInt(req.params.campagneId) },
      update: { opens, clicks, conversions },
      create: {
        campagneId: parseInt(req.params.campagneId),
        opens: opens || 0,
        clicks: clicks || 0,
        conversions: conversions || 0
      }
    })
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router