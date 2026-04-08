const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET KPIs globaux
router.get('/kpis', async (req, res) => {
  try {
    const [
      totalClients,
      totalContacts,
      totalCampagnes,
      totalSegments,
      campagnesEnvoyees,
      campagnesPlanifiees,
      stats
    ] = await Promise.all([
      prisma.client.count(),
      prisma.contact.count(),
      prisma.campagne.count(),
      prisma.segment.count(),
      prisma.campagne.count({ where: { status: 'sent' } }),
      prisma.campagne.count({ where: { status: 'scheduled' } }),
      prisma.campagneStats.aggregate({
        _sum: { emailsSent: true, opens: true, clicks: true, conversions: true }
      })
    ])

    const totalEmailsSent = stats._sum.emailsSent || 0
    const totalOpens = stats._sum.opens || 0
    const totalClicks = stats._sum.clicks || 0
    const totalConversions = stats._sum.conversions || 0

    const tauxOuvertureMoyen = totalEmailsSent > 0
      ? Math.round((totalOpens / totalEmailsSent) * 100)
      : 0

    const tauxClicMoyen = totalEmailsSent > 0
      ? Math.round((totalClicks / totalEmailsSent) * 100)
      : 0

    const tauxConversionMoyen = totalEmailsSent > 0
      ? Math.round((totalConversions / totalEmailsSent) * 100)
      : 0

    const roiTotal = totalConversions > 0
      ? Math.round(((totalConversions * 99) / Math.max(totalEmailsSent * 0.5, 1)) * 100)
      : 0

    res.json({
      overview: {
        totalClients,
        totalContacts,
        totalCampagnes,
        totalSegments,
        campagnesEnvoyees,
        campagnesPlanifiees
      },
      performance: {
        totalEmailsSent,
        totalOpens,
        totalClicks,
        totalConversions,
        tauxOuvertureMoyen,
        tauxClicMoyen,
        tauxConversionMoyen,
        roiTotal
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET KPIs par client
router.get('/kpis/client/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId)

    const [
      totalContacts,
      totalCampagnes,
      totalSegments,
      campagnesEnvoyees,
      stats
    ] = await Promise.all([
      prisma.contact.count({ where: { clientId } }),
      prisma.campagne.count({ where: { clientId } }),
      prisma.segment.count({ where: { clientId } }),
      prisma.campagne.count({ where: { clientId, status: 'sent' } }),
      prisma.campagneStats.aggregate({
        where: { campagne: { clientId } },
        _sum: { emailsSent: true, opens: true, clicks: true, conversions: true }
      })
    ])

    const totalEmailsSent = stats._sum.emailsSent || 0
    const totalOpens = stats._sum.opens || 0
    const totalClicks = stats._sum.clicks || 0
    const totalConversions = stats._sum.conversions || 0

    res.json({
      clientId,
      totalContacts,
      totalCampagnes,
      totalSegments,
      campagnesEnvoyees,
      totalEmailsSent,
      totalOpens,
      totalClicks,
      totalConversions,
      tauxOuverture: totalEmailsSent > 0 ? Math.round((totalOpens / totalEmailsSent) * 100) : 0,
      tauxClic: totalEmailsSent > 0 ? Math.round((totalClicks / totalEmailsSent) * 100) : 0,
      roi: totalConversions > 0 ? Math.round(((totalConversions * 99) / Math.max(totalEmailsSent * 0.5, 1)) * 100) : 0
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET évolution campagnes par mois
router.get('/evolution', async (req, res) => {
  try {
    const campagnes = await prisma.campagne.findMany({
      orderBy: { createdAt: 'asc' },
      include: { stats: true }
    })

    const parMois = {}
    campagnes.forEach(c => {
      const mois = new Date(c.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      if (!parMois[mois]) {
        parMois[mois] = { mois, campagnes: 0, emailsSent: 0, opens: 0, conversions: 0 }
      }
      parMois[mois].campagnes++
      if (c.stats) {
        parMois[mois].emailsSent += c.stats.emailsSent || 0
        parMois[mois].opens += c.stats.opens || 0
        parMois[mois].conversions += c.stats.conversions || 0
      }
    })

    res.json(Object.values(parMois))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router