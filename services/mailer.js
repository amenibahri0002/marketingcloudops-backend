const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

async function sendConfirmationEmail(to, name) {
  const mailOptions = {
    from: '"MarketingCloudOps" <' + process.env.EMAIL_USER + '>',
    to: to,
    subject: 'Confirmation inscription — Conference IA 2026',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#131313;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
          
          <!-- Header -->
          <div style="background:#131313;padding:40px;border-bottom:1px solid #2a2a2a;text-align:center;">
            <h1 style="color:#f5f3ee;font-size:1.5rem;margin:0;">
              Tech<span style="color:#c8f53e;">Event</span>
            </h1>
          </div>

          <!-- Body -->
          <div style="padding:40px;">
            <h2 style="color:#f5f3ee;font-size:1.3rem;margin:0 0 16px;">
              Bonjour ${name} !
            </h2>
            <p style="color:#8a8880;line-height:1.7;margin:0 0 24px;">
              Votre inscription a la <strong style="color:#f5f3ee;">Conference IA 2026</strong> 
              a ete confirmee avec succes.
            </p>

            <!-- Details -->
            <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin:0 0 24px;">
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2a2a;">
                <span style="color:#8a8880;font-size:0.85rem;">Evenement</span>
                <span style="color:#f5f3ee;font-size:0.85rem;">Conference IA 2026</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2a2a;">
                <span style="color:#8a8880;font-size:0.85rem;">Date</span>
                <span style="color:#f5f3ee;font-size:0.85rem;">20 Mai 2026</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2a2a;">
                <span style="color:#8a8880;font-size:0.85rem;">Lieu</span>
                <span style="color:#f5f3ee;font-size:0.85rem;">Palais des Congres, Tunis</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;">
                <span style="color:#8a8880;font-size:0.85rem;">Statut</span>
                <span style="background:rgba(200,245,62,0.15);color:#c8f53e;padding:2px 12px;border-radius:100px;font-size:0.78rem;border:1px solid rgba(200,245,62,0.3);">
                  Confirme
                </span>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 24px;">
              <a href="https://techevent-frontend.vercel.app" 
                style="display:inline-block;background:#c8f53e;color:#0a0a0a;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:600;font-size:0.95rem;">
                Voir mon inscription
              </a>
            </div>

            <p style="color:#555;font-size:0.8rem;text-align:center;margin:0;">
              Remboursement possible jusqu'au 1er mai 2026.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
            <p style="color:#555;font-size:0.78rem;margin:0;">
              MarketingCloudOps — TechEventCo © 2026
            </p>
          </div>

        </div>
      </body>
      </html>
    `
  }

  await transporter.sendMail(mailOptions)
  console.log('Email de confirmation envoye a :', to)
}

module.exports = { sendConfirmationEmail }