const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const getEmailTemplate = (campagne, contact, client) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: #4f46e5; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .body h2 { color: #4f46e5; }
        .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${client.name}</h1>
          <p>${campagne.title}</p>
        </div>
        <div class="body">
          <h2>Bonjour ${contact.name} 👋</h2>
          <p>Nous avons le plaisir de vous inviter à notre événement :</p>
          <div class="info-box">
            <div class="info-line">
              <strong>Événement</strong>
              <span>${campagne.title}</span>
            </div>
            <div class="info-line">
              <strong>Type</strong>
              <span>${campagne.type}</span>
            </div>
            <div class="info-line">
              <strong>Organisateur</strong>
              <span>${client.name}</span>
            </div>
            ${campagne.dateScheduled ? `
            <div class="info-line">
              <strong>Date</strong>
              <span>${new Date(campagne.dateScheduled).toLocaleDateString('fr-FR')}</span>
            </div>` : ''}
          </div>
          <p>Ne manquez pas cette opportunité exceptionnelle !</p>
          <a href="https://techevent-app.onrender.com" class="btn">S'inscrire maintenant</a>
        </div>
        <div class="footer">
          <p>© 2026 ${client.name} — Tous droits réservés</p>
          <p>Vous recevez cet email car vous êtes inscrit à nos événements.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

router.post('/send/:campagneId', async (req, res) => {
  try {
    const campagne = await prisma.campagne.findUnique({
      where: { id: parseInt(req.params.campagneId) },
      include: { client: true }
    });
    if (!campagne) return res.status(404).json({ message: 'Campagne non trouvée' });

    const contacts = await prisma.contact.findMany({ where: { clientId: campagne.clientId } });
    if (contacts.length === 0) return res.status(400).json({ message: 'Aucun contact pour ce client' });

    // 🔹 Envoyer tous les emails en parallèle
    const sendPromises = contacts.map(contact =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: contact.email,
        subject: `${campagne.client.name} — ${campagne.title}`,
        html: getEmailTemplate(campagne, contact, campagne.client)
      }).catch(err => {
        console.error(`Erreur envoi email à ${contact.email}:`, err);
        return null; // ne bloque pas les autres emails
      })
    );

    const results = await Promise.all(sendPromises);
    const sent = results.filter(r => r !== null).length;

    // Mettre à jour la campagne et stats
    await prisma.campagne.update({ where: { id: campagne.id }, data: { status: 'sent', sentAt: new Date() } });
    await prisma.campagneStats.upsert({
      where: { campagneId: campagne.id },
      update: { emailsSent: sent },
      create: { campagneId: campagne.id, emailsSent: sent, opens: 0, clicks: 0, conversions: 0 }
    });

    res.json({ message: `${sent} email(s) envoyé(s) avec succès`, sent });
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi email', error: err.message });
  }
});
module.exports = router