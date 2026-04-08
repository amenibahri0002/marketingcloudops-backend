const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Fonction pour recalculer les segments automatiquement
async function recalculerSegments(clientId, contactId = null) {
  try {
    // Récupérer les segments du client
    const segments = await prisma.segment.findMany({
      where: { clientId },
      include: { contacts: true }
    });

    // Si un contactId est fourni, ne récupérer que ce contact
    const contacts = contactId
      ? await prisma.contact.findMany({ where: { id: contactId, clientId } })
      : await prisma.contact.findMany({ where: { clientId } });

    for (const segment of segments) {
      const criteres = segment.criteria.split(' | ');

      for (const contact of contacts) {
        const dejaDansSegment = segment.contacts.some(cs => cs.contactId === contact.id);

        let correspond = false;
        for (const critere of criteres) {
          if (critere.includes('Localisation') && contact.phone) correspond = true;
          if (critere.includes('Inscrit récemment')) {
            const dateCreation = new Date(contact.createdAt);
            const maintenant = new Date();
            const diffJours = (maintenant - dateCreation) / (1000 * 60 * 60 * 24);
            if (diffJours <= 30) correspond = true;
          }
          if (critere.includes('Utilisateur actif')) correspond = true;
        }

        if (correspond && !dejaDansSegment) {
          await prisma.contactSegment.create({
            data: { segmentId: segment.id, contactId: contact.id }
          });
          console.log(`Contact ${contact.email} ajouté automatiquement au segment ${segment.name}`);
        }
      }
    }
  } catch (err) {
    console.error('Erreur recalcul segments:', err.message);
  }
}
// GET tous les segments
router.get('/', async (req, res) => {
  try {
    const user = req.user
    let segments
    if (user.role === 'ADMIN') {
      segments = await prisma.segment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { client: true, contacts: { include: { contact: true } } }
      })
    } else {
      segments = await prisma.segment.findMany({
        where: { clientId: user.clientId },
        orderBy: { createdAt: 'desc' },
        include: { client: true, contacts: { include: { contact: true } } }
      })
    }
    res.json(segments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST créer un segment
router.post('/', async (req, res) => {
  try {
    const { name, criteria, clientId } = req.body
    const segment = await prisma.segment.create({
      data: { name, criteria, clientId: parseInt(clientId) }
    })
    // Recalcul automatique après création
    await recalculerSegments(parseInt(clientId))
    res.json(segment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST ajouter contact manuellement
router.post('/:id/contacts', async (req, res) => {
  try {
    const { contactId } = req.body
    const cs = await prisma.contactSegment.create({
      data: {
        segmentId: parseInt(req.params.id),
        contactId: parseInt(contactId)
      }
    })
    res.json(cs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST recalculer segments manuellement
router.post('/recalculer/:clientId', async (req, res) => {
  try {
    await recalculerSegments(parseInt(req.params.clientId))
    res.json({ message: 'Segments recalculés avec succès' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE supprimer un segment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contactSegment.deleteMany({ where: { segmentId: parseInt(req.params.id) } })
    await prisma.segment.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Segment supprimé' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
module.exports.recalculerSegments = recalculerSegments