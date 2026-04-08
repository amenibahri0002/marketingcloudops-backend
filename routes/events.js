const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')
const { requirePermission } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET tous les evenements
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await prisma.campagne.findMany({
      where: { type: 'event' },
      orderBy: { createdAt: 'desc' },
      include: { client: true }
    })
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST creer evenement — Resp. Marketing
router.post('/', authMiddleware, requirePermission('GERER_EVENEMENTS'), async (req, res) => {
  try {
    const { title, description, date, clientId } = req.body
    const event = await prisma.campagne.create({
      data: {
        title,
        type: 'event',
        status: 'scheduled',
        clientId: parseInt(clientId)
      }
    })
    res.status(201).json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT modifier evenement
router.put('/:id', authMiddleware, requirePermission('GERER_EVENEMENTS'), async (req, res) => {
  try {
    const { title, status } = req.body
    const event = await prisma.campagne.update({
      where: { id: parseInt(req.params.id) },
      data: { title, status }
    })
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE supprimer evenement
router.delete('/:id', authMiddleware, requirePermission('GERER_EVENEMENTS'), async (req, res) => {
  try {
    await prisma.campagne.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Evenement supprime' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router