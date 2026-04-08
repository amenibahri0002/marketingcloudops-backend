const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendConfirmationEmail } = require("../mailing");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/register — inscription à un événement
router.post('/', async (req, res) => {
  const { name, email, phone, eventId, ticket } = req.body;

  if (!name || !email || !eventId) {
    return res.status(400).json({ error: 'Nom, email et événement requis' });
  }

  try {
    // Récupérer l'événement
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Événement introuvable' });

    // Chercher ou créer le contact
    let contact = await prisma.contact.findFirst({
      where: { email, clientId: event.clientId }
    });
    if (!contact) {
      contact = await prisma.contact.create({
        data: { name, email, phone, clientId: event.clientId }
      });
    }

    // Vérifier si déjà inscrit
    const existing = await prisma.registration.findUnique({
      where: { contactId_eventId: { contactId: contact.id, eventId } }
    });
    if (existing) {
      return res.status(409).json({ error: 'Déjà inscrit à cet événement' });
    }

    // Créer l'inscription
    // Créer l'inscription
const registration = await prisma.registration.create({
  data: { contactId: contact.id, eventId, ticket: ticket || 'STANDARD' }
})

// 🔹 Envoyer l'email en arrière-plan (non-blocking)
(async () => {
  try {
    await sendConfirmationEmail(contact.email, contact.name, event.title)
    console.log(`Email envoyé à ${contact.email}`)
  } catch (err) {
    console.error('Erreur lors de l’envoi de l’email:', err)
  }
})()

// Répondre immédiatement au frontend
res.status(201).json({
  message: 'Inscription confirmée !',
  registration,
  contact: { name: contact.name, email: contact.email }
})

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;