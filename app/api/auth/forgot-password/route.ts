import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to avoid email enumeration
  if (!user) return NextResponse.json({ success: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await prisma.user.update({
    where: { email },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://poke-auction-wheat.vercel.app'
  const resetUrl = `${siteUrl}/auth/reset-password?token=${token}`
  const emailConfigured = !!(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)

  if (emailConfigured) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"Poke Auction" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: 'Reset your Poke Auction password',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#06060d;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0e0e1a;border:1px solid #2a2a3d;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#c9a227,#a07818);padding:32px 40px;">
      <h1 style="margin:0;color:#06060d;font-size:28px;letter-spacing:2px;font-weight:900;">POKE AUCTION</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">Password Reset Request</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hi ${user.name || email.split('@')[0]},<br><br>
        We received a request to reset your password. Click the button below to set a new one.
        This link expires in <strong style="color:#c9a227;">1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#c9a227,#a07818);color:#06060d;
                text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;
                font-size:14px;letter-spacing:1px;">
        RESET PASSWORD
      </a>
      <p style="color:#4b5563;font-size:12px;margin:24px 0 0;line-height:1.6;">
        If you didn't request this, you can safely ignore this email. Your password will not change.<br><br>
        Or copy this link: <a href="${resetUrl}" style="color:#c9a227;">${resetUrl}</a>
      </p>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #2a2a3d;text-align:center;">
      <p style="color:#4b5563;font-size:11px;margin:0;">© ${new Date().getFullYear()} Poke Auction. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ success: true })
  }

  // Email not configured — return the link directly so user can still reset
  return NextResponse.json({ success: true, resetUrl })
}
