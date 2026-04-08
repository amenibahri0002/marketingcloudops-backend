const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const user = req.user
    let clients
    if (user.role === 'ADMIN') {
      clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
    } else {
      clients = await prisma.client.findMany({
        where: { id: user.clientId },
        orderBy: { createdAt: 'desc' }
      })
    }
    res.json(clients)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body
    const client = await prisma.client.create({ data: { name, email } })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Client supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router