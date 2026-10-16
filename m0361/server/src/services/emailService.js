import nodemailer from 'nodemailer'
import User from '../models/User.js'
import logger from '../utils/logger.js'
import { env } from '../config/env.js'

let transporter = null

export function isEmailEnabled() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass)
}

function getTransporter() {
  if (transporter) return transporter
  if (!isEmailEnabled()) return null
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  })
  return transporter
}

const INK = '#1c2b4a'
const MUTED = '#5b6b8c'
const BLUE = '#0057ff'
const PAPER = '#f8f7f4'
const HAIRLINE = 'rgba(0,87,255,.2)'

// Links inside emails must open on the reader's device — prefer the public
// URL when configured, otherwise fall back to CLIENT_URL.
const siteUrl = (env.mailPublicUrl || env.clientUrl).replace(/\/$/, '')

function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, '')
}

function layout({ kicker = null, heading, intro, lines = [], cta = null, closing = 'The VentureBridge team' }) {
  const preheader = stripTags(intro).slice(0, 120)
  const rows = lines.map(l => `<p style="margin:8px 0;font-size:14px;line-height:1.65;color:${INK};">${l}</p>`).join('')
  const eyebrow = kicker
    ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${BLUE};">${kicker}</p>`
    : ''
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr><td style="background:${BLUE};"><a href="${cta.href}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;">${cta.label}</a></td></tr></table>
<p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">Button not working? Paste this link into your browser:<br /><a href="${cta.href}" style="color:${BLUE};word-break:break-all;">${cta.href}</a></p>`
    : ''
  const year = new Date().getFullYear()
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${HAIRLINE};max-width:600px;width:100%;">
<tr><td style="background:${BLUE};padding:18px 28px;">
<span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-.02em;">venturebridge</span><br />
<span style="color:rgba(255,255,255,.75);font-size:12px;">Founder&ndash;investor network</span>
</td></tr>
<tr><td style="padding:30px 30px 8px;">
${eyebrow}
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${BLUE};">${heading}</h1>
<p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:${INK};">${intro}</p>
${rows}${button}
<p style="margin:22px 0 0;font-size:14px;color:${INK};">${closing}</p>
</td></tr>
<tr><td style="padding:18px 30px;border-top:1px solid ${HAIRLINE};">
<p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">Discovery &amp; introductions for founders and investors. VentureBridge never moves money.</p>
<p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">&copy; ${year} VentureBridge Technologies Pvt. Ltd., Bengaluru &middot; Mumbai. You received this email because you have a VentureBridge account.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
  const text = [heading, '', stripTags(intro), ...lines.map(stripTags), cta ? '' : null, cta ? `${cta.label}: ${cta.href}` : null, '', closing, '— VentureBridge'].filter(v => v !== null).join('\n')
  return { html, text }
}

export const templates = {
  welcome(name, role) {
    const subject = 'Welcome to VentureBridge'
    const { html, text } = layout({
      kicker: 'Welcome to VentureBridge',
      heading: `Welcome, ${name}`,
      intro: `Your ${role} account is verified and ready to use.`,
      lines: [
        'Complete your profile to help founders and investors find the right fit.',
        'Listing and browsing are free during the current beta.',
      ],
      cta: { label: 'Open VentureBridge', href: siteUrl },
    })
    return { subject, html, text }
  },

  verificationCode(code) {
    const subject = 'Your VentureBridge verification code'
    const { html, text } = layout({
      kicker: 'Email verification',
      heading: 'Verify your email address',
      intro: 'Enter this one-time code to finish creating your VentureBridge account:',
      lines: [`<strong style="font-size:28px;letter-spacing:8px;color:${BLUE};">${code}</strong>`, 'This code expires in 10 minutes. If you did not create an account, you can ignore this email.'],
      closing: 'The VentureBridge team',
    })
    return { subject, html, text }
  },

  requestReceived(receiverName, senderName, startupName) {
    const subject = `${senderName} sent you a collaboration request`
    const { html, text } = layout({
      kicker: 'Collaboration request',
      heading: 'New collaboration request',
      intro: `Hi ${receiverName}, <strong>${senderName}</strong>${startupName ? ` (re: <strong>${startupName}</strong>)` : ''} wants to connect with you on VentureBridge.`,
      lines: ['Review the request in your dashboard and accept or decline — declines stay private.'],
      cta: { label: 'Review request', href: `${siteUrl}/requests` },
    })
    return { subject, html, text }
  },

  requestAccepted(senderName, acceptorName) {
    const subject = `${acceptorName} accepted your collaboration request`
    const { html, text } = layout({
      kicker: 'Request update',
      heading: 'Request accepted',
      intro: `Hi ${senderName}, good news — <strong>${acceptorName}</strong> accepted your collaboration request.`,
      lines: ['A connection and a direct chat thread are now open in your dashboard.'],
      cta: { label: 'Open conversation', href: `${siteUrl}/chat` },
    })
    return { subject, html, text }
  },

  requestDeclined(senderName) {
    const subject = 'Update on your collaboration request'
    const { html, text } = layout({
      kicker: 'Request update',
      heading: 'Request declined',
      intro: `Hi ${senderName}, the collaboration request you sent was declined. Declines are private and no reason is shared.`,
      lines: ['Your match breakdown is still available — refine your shortlist and keep going.'],
      cta: { label: 'View matches', href: `${siteUrl}/dashboard` },
    })
    return { subject, html, text }
  },

  interestReceived(ownerName, investorName, startupName) {
    const subject = `${investorName} is interested in ${startupName}`
    const { html, text } = layout({
      kicker: 'Investor interest',
      heading: 'An investor likes what they see',
      intro: `Hi ${ownerName}, <strong>${investorName}</strong> expressed interest in <strong>${startupName}</strong>.`,
      lines: ['This is a lightweight signal — no request yet. Review their thesis and start a collaboration request if it fits.'],
      cta: { label: 'View dashboard', href: `${siteUrl}/dashboard` },
    })
    return { subject, html, text }
  },

  meetingProposed(name, proposer, slotsLabel, link) {
    const subject = `${proposer} proposed a call`
    const { html, text } = layout({
      kicker: 'Call proposed',
      heading: 'Pick a time for your first call',
      intro: `Hi ${name}, <strong>${proposer}</strong> proposed a call: <strong>${slotsLabel}</strong>.`,
      lines: [
        'Open your connections to accept a slot or propose another time.',
        ...(link ? [`Meeting link: <a href="${link}" style="color:#0057ff;">${link}</a>`] : []),
      ],
      cta: { label: 'Open connections', href: `${siteUrl}/connections` },
    })
    return { subject, html, text }
  },

  meetingAccepted(name, confirmer, slotLabel, link) {
    const subject = `Call confirmed: ${slotLabel}`
    const { html, text } = layout({
      kicker: 'Call confirmed',
      heading: 'Your call is on the calendar',
      intro: `Hi ${name}, <strong>${confirmer}</strong> confirmed <strong>${slotLabel}</strong>.`,
      lines: link ? [`Join here: ${link}`] : ['Check the connection for joining details.'],
      cta: { label: 'Open messages', href: `${siteUrl}/messages` },
    })
    return { subject, html, text }
  },

  accountVerified(name, approved) {
    const subject = approved ? 'Your VentureBridge account is verified' : 'Action needed: account verification'
    const { html, text } = layout({
      kicker: approved ? 'Account verified' : 'Verification update',
      heading: approved ? 'You are verified' : 'Verification needs attention',
      intro: approved
        ? `Hi ${name}, your account has been verified. You can now sign in and start discovering matches.`
        : `Hi ${name}, our reviewers could not verify your account. Please update your profile information and it will be reviewed again.`,
      cta: { label: approved ? 'Sign in' : 'Update profile', href: approved ? `${siteUrl}/auth/login` : `${siteUrl}/settings` },
    })
    return { subject, html, text }
  },

  profileVerified(name, kind, itemName, approved) {
    const subject = approved ? `Your ${kind} profile is verified` : `Action needed: ${kind} verification`
    const { html, text } = layout({
      kicker: approved ? `${kind} verified` : 'Verification update',
      heading: approved ? `${kind} verified` : `${kind} verification needs attention`,
      intro: approved
        ? `Hi ${name}, <strong>${itemName}</strong> has been verified and now ranks in discovery.`
        : `Hi ${name}, <strong>${itemName}</strong> could not be verified. Please update the profile and it will be reviewed again.`,
      cta: { label: 'Open dashboard', href: `${siteUrl}/dashboard` },
    })
    return { subject, html, text }
  },

  newMatchForInvestor(investorName, startupName, score) {
    const subject = `New ${score}% match: ${startupName}`
    const { html, text } = layout({
      kicker: 'New matching startup',
      heading: `${startupName} fits your thesis at ${score}%`,
      intro: `Hi ${investorName}, a newly verified startup matches your investment preferences.`,
      lines: [`Match score ${score}% across industry, range, stage, risk, location and equity.`],
      cta: { label: 'View matches', href: `${siteUrl}/discover/startups` },
    })
    return { subject, html, text }
  },

  newMatchForEntrepreneur(ownerName, investorOrg, score) {
    const subject = `New investor fit: ${investorOrg} (${score}%)`
    const { html, text } = layout({
      kicker: 'New matching investor',
      heading: `${investorOrg} matches your startup at ${score}%`,
      intro: `Hi ${ownerName}, a newly verified investor fits your funding requirements.`,
      lines: [`Match score ${score}% across industry, range, stage, risk, location and equity.`],
      cta: { label: 'View matches', href: `${siteUrl}/discover/investors` },
    })
    return { subject, html, text }
  },
}

async function sendMail({ to, subject, html, text, required = false }) {
  const tx = getTransporter()
  if (!tx) {
    if (required) {
      const error = new Error('Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable account verification.')
      error.statusCode = 503
      error.isOperational = true
      throw error
    }
    logger.debug('Email skipped (SMTP not configured)', { to, subject })
    return { skipped: true }
  }
  try {
    const info = await tx.sendMail({ from: env.mailFrom, to, subject, html, text })
    logger.info('Email sent', { to, subject, messageId: info.messageId })
    return { messageId: info.messageId }
  } catch (error) {
    // Email must never break the request that triggered it
    logger.warn('Email send failed', { to, subject, error: error.message })
    if (required) {
      const deliveryError = new Error('Could not send the verification email. Check the SMTP settings and try again.')
      deliveryError.statusCode = 503
      deliveryError.isOperational = true
      throw deliveryError
    }
    return null
  }
}

export function sendVerificationCode(email, code) {
  return sendMail({ to: email, ...templates.verificationCode(code), required: true })
}

/**
 * Look up a user by id and send them a templated email.
 * Accepts either a ready { subject, html, text } object or
 * { build: user => ({ subject, html, text }) } so templates can use the
 * recipient's name without an extra query in the controller.
 * Never throws — safe to call fire-and-forget from controllers.
 */
export async function notifyUser(userId, mail) {
  try {
    const user = await User.findById(userId).select('name email').lean()
    if (!user?.email) return null
    const { subject, html, text } = typeof mail?.build === 'function' ? mail.build(user) : mail
    if (!subject || !toValid(user.email)) return null
    return await sendMail({ to: user.email, subject, html, text })
  } catch (error) {
    logger.warn('notifyUser failed', { userId: String(userId), error: error.message })
    return null
  }
}

function toValid(email) {
  return typeof email === 'string' && email.includes('@')
}

export default { isEmailEnabled, notifyUser, sendMail, templates }
