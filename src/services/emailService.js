// src/services/emailService.js
// EMAIL_MODE=smtp  → nodemailer (local / servidores que permiten SMTP)
// EMAIL_MODE=api   → Brevo HTTP API (Railway y PaaS que bloquean puertos SMTP)

import nodemailer from 'nodemailer'

const MODE = (process.env.EMAIL_MODE || 'smtp').toLowerCase()

// ─── Transporte SMTP (nodemailer) ─────────────────────────────────────────────

const transporter = MODE === 'smtp'
  ? nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null

// ─── Función base de envío ────────────────────────────────────────────────────

async function sendMail({ to, subject, html }) {
  if (MODE === 'api') {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender:      { name: 'ConnectPro', email: process.env.EMAIL_FROM_ADDRESS },
        to:          [{ email: to }],
        subject,
        htmlContent: html
      })
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Brevo API ${res.status}: ${body}`)
    }

    console.log(`✅ [api] Email enviado a ${to}`)
    return
  }

  // MODE === 'smtp'
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject,
    html
  })
  console.log(`✅ [smtp] Email enviado a ${to}`)
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`

  await sendMail({
    to: toEmail,
    subject: 'Restablecer contraseña — ConnectPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #9a1e1d;">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ConnectPro</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background:#9a1e1d;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#666;font-size:13px;">El enlace expira en <strong>30 minutos</strong>.</p>
        <p style="color:#666;font-size:13px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `
  })
}
