const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const {
  loginLimiter,
  registerLimiter,
  validateLogin,
  validateRegister,
  checkValidation
} = require('../middleware/security')
const JWT_SECRET = process.env.JWT_SECRET || 'secret123'

router.post('/register', registerLimiter, validateRegister, checkValidation, async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'CLIENT' }
    })
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET)
    res.json({ message: 'Compte cree avec succes', token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

router.post('/login', loginLimiter, validateLogin, checkValidation, async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'Mot de passe incorrect' })
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET)
    res.json({ message: 'Connexion reussie', token })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ message: 'Token manquant' })
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' })
  }
})

module.exports = router