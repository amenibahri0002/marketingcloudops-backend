const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { recalculerSegments } = require('./segments')

router.get('/', async (req, res) => {
  try {
    const user = req.user
    let contacts
    if (user.role === 'ADMIN') {
      contacts = await prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      })
    } else {
      contacts = await prisma.contact.findMany({
        where: { clientId: user.clientId },
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      })
    }
    res.json(contacts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, clientId } = req.body
    const contact = await prisma.contact.create({
      data: { name, email, phone, clientId: clientId ? parseInt(clientId) : null }
    })

    // Recalcul automatique des segments
    if (clientId) {
      await recalculerSegments(parseInt(clientId))
    }

    res.json(contact)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.contact.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Contact supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router