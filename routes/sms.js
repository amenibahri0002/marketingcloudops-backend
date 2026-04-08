const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/send/:campagneId', async (req, res) => {
  try {
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const campagne = await prisma.campagne.findUnique({
      where: { id: parseInt(req.params.campagneId) },
      include: { client: true }
    })

    if (!campagne) return res.status(404).json({ message: 'Campagne non trouvée' })

    const contacts = await prisma.contact.findMany({
      where: { clientId: campagne.clientId }
    })

    if (contacts.length === 0) return res.status(400).json({ message: 'Aucun contact' })

    let sent = 0
    for (const contact of contacts) {
      if (contact.phone) {
        try {
          await client.messages.create({
            body: `${campagne.client.name} — ${campagne.title}\nBonjour ${contact.name}, vous êtes invité(e) à notre événement !`,
            from: process.env.TWILIO_PHONE,
            to: contact.phone
          })
          sent++
        } catch (err) {
          console.log('SMS error pour', contact.phone, ':', err.message)
        }
      }
    }

    await prisma.campagne.update({
      where: { id: campagne.id },
      data: { status: 'sent', sentAt: new Date() }
    })

    res.json({ message: `${sent} SMS envoyé(s) avec succès`, sent })
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi SMS', error: err.message })
  }
})

module.exports = router