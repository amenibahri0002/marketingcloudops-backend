const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const authMiddleware = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const user = req.user
    let campagnes
    if (user.role === 'ADMIN') {
      campagnes = await prisma.campagne.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      })
    } else {
      campagnes = await prisma.campagne.findMany({
        where: { clientId: user.clientId },
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      })
    }
    res.json(campagnes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, type, clientId, dateScheduled } = req.body
    const campagne = await prisma.campagne.create({
      data: {
        title,
        type,
        clientId: parseInt(clientId),
        dateScheduled: dateScheduled ? new Date(dateScheduled) : null
      }
    })
    res.json(campagne)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { title, status, dateScheduled } = req.body
    const campagne = await prisma.campagne.update({
      where: { id: parseInt(req.params.id) },
      data: { title, status, dateScheduled: dateScheduled ? new Date(dateScheduled) : undefined }
    })
    res.json(campagne)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.campagne.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Campagne supprimee' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
