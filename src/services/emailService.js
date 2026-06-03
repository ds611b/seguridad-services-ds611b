// src/services/emailService.js

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: 'Restablecer contraseña — ConnectPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #333;">Restablecer contraseña</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ConnectPro</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="background:#1a73e8;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#666;font-size:13px;">El enlace expira en <strong>30 minutos</strong>.</p>
          <p style="color:#666;font-size:13px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `
    })
    console.log(`✅ Email de reset enviado a ${toEmail}`)
  } catch (error) {
    console.error('❌ Error enviando email:', error.message)
    throw error
  }
}


