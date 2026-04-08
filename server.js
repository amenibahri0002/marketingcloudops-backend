const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
const client = require('prom-client')
const { authenticate } = require('./middleware/auth')
const axios = require('axios')

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

const clientRoutes = require('./routes/clients')
app.use('/api/clients', authenticate, clientRoutes)

const campagnesRoutes = require('./routes/campagnes')
app.use('/api/campagnes', authenticate, campagnesRoutes)

const contactsRoutes = require('./routes/contacts')
app.use('/api/contacts', authenticate, contactsRoutes)

const emailsRoutes = require('./routes/emails')
app.use('/api/emails', authenticate, emailsRoutes)

const segmentsRoutes = require('./routes/segments')
app.use('/api/segments', authenticate, segmentsRoutes)

const statsRoutes = require('./routes/stats')
app.use('/api/stats', authenticate, statsRoutes)

const usersRoutes = require('./routes/users')
app.use('/api/users', authenticate, usersRoutes)

const alertesRoutes = require('./routes/alertes')
app.use('/api/alertes', authenticate, alertesRoutes)

const notifRoutes = require('./routes/notifications')
app.use('/api/notifications', authenticate, notifRoutes)
const smsRoutes = require('./routes/sms')
app.use('/api/sms', authenticate, smsRoutes)
const analyticsRoutes = require('./routes/analytics')
app.use('/api/analytics', authenticate, analyticsRoutes)

client.collectDefaultMetrics({ timeout: 5000 })

const inscriptionsTotal = new client.Counter({
  name: 'techevent_inscriptions_total',
  help: 'Nombre total inscriptions'
})

async function pushMetricsToGrafana() {
  try {
    const metrics = await client.register.metrics()
    const lines = metrics.split('\n').filter(function(l) {
      return !l.startsWith('#') && l.trim() !== ''
    })

    const data = lines.map(function(line) {
      const parts = line.trim().split(' ')
      const name = parts[0].split('{')[0]
      const value = parseFloat(parts[parts.length - 1])
      if (!isNaN(value)) {
        return name + ' ' + value
      }
      return null
    }).filter(Boolean).join('\n')

    await axios.post(
      'https://prometheus-prod-58-prod-eu-central-0.grafana.net/api/prom/push',
      data,
      {
        headers: { 'Content-Type': 'text/plain' },
        auth: {
          username: '3087920',
          password: ''
        }
      }
    )
    console.log('Grafana push success')
  } catch (err) {
    console.log('Grafana push error:', err.response ? err.response.status : err.message)
  }
}

setInterval(pushMetricsToGrafana, 15000)

app.get('/health', function(req, res) {
  res.json({ status: 'ok' })
})

app.get('/metrics', async function(req, res) {
  res.set('Content-Type', client.register.contentType)
  res.end(await client.register.metrics())
})

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    
    // Créer inscription
    const inscription = await prisma.inscription.create({
      data: { name, email, phone }
    })
    inscriptionsTotal.inc()

    // Ajouter automatiquement comme contact dans MarketingCloudOps
    try {
      const clientTechEvent = await prisma.client.findFirst({
        where: { name: 'TechEventCo' }
      })
      
      if (clientTechEvent) {
        const existingContact = await prisma.contact.findFirst({
          where: { email }
        })
        
        if (!existingContact) {
          await prisma.contact.create({
            data: {
              name,
              email,
              phone,
              clientId: clientTechEvent.id
            }
          })
          console.log('Contact ajouté automatiquement:', email)
        }
      }
    } catch (err) {
      console.log('Erreur ajout contact:', err.message)
    }

    res.json({ message: 'Inscription reussie !', data: inscription })
  } catch (err) {
    console.error('Erreur:', err)
    res.status(500).json({ message: 'Erreur serveur', error: err.message })
  }
})

app.get('/api/inscriptions', async function(req, res) {
  try {
    const inscriptions = await prisma.inscription.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(inscriptions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, function() {
  console.log('Backend sur http://localhost:' + PORT)
})