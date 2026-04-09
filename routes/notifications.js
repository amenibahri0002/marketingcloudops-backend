const express  = require('express')
const webpush  = require('web-push')
const { PrismaClient } = require('@prisma/client')
const authenticate = require('../middleware/auth')
const router = express.Router()
const prisma = new PrismaClient()

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint }
    })
    if (existing) return res.json({ message: 'Deja abonne' })
    await prisma.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh:   subscription.keys.p256dh,
        auth:     subscription.keys.auth,
        userId:   req.user.id
      }
    })
    res.json({ message: 'Abonnement enregistre' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/send', authenticate, async (req, res) => {
  try {
    const { title, body, url, userId } = req.body
    const where = userId ? { userId: parseInt(userId) } : {}
    const subs  = await prisma.pushSubscription.findMany({ where })
    const payload = JSON.stringify({ title, body, url: url || '/' })
    const results = []
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        results.push({ id: sub.id, status: 'sent' })
      } catch (err) {
        results.push({ id: sub.id, status: 'failed', error: err.message })
      }
    }
    res.json({ sent: results.filter(r => r.status === 'sent').length, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

module.exports = router
