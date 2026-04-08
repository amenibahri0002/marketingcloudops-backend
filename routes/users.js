const express = require('express')
const bcrypt  = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const authMiddleware = require('../middleware/auth')
const { requireRole, ROLES } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id:true, name:true, email:true, role:true, clientId:true, createdAt:true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { name, email, password, role, clientId } = req.body

    const validRoles = Object.values(ROLES)
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role invalide. Roles valides: ' + validRoles.join(', ') })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name, email,
        password: hashed,
        role: role || ROLES.CLIENT,
        clientId: clientId ? parseInt(clientId) : null
      }
    })
    res.status(201).json({ id:user.id, name:user.name, email:user.email, role:user.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { role } = req.body
    const validRoles = Object.values(ROLES)
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role invalide' })
    }
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id:true, name:true, email:true, role:true }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Utilisateur supprime' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router