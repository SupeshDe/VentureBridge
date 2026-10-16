import Meeting from '../models/Meeting.js'
import Connection from '../models/Connection.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import { createNotification } from '../services/notificationService.js'
import { notifyUser, templates } from '../services/emailService.js'

async function loadConnection(connectionId, userId) {
  const connection = await Connection.findById(connectionId)
    .populate('entrepreneur', 'name')
    .populate('investor', 'name')
  if (!connection) return { error: 'Connection not found', status: 404 }
  const mine = [String(connection.entrepreneur?._id || connection.entrepreneur), String(connection.investor?._id || connection.investor)]
  if (!mine.includes(String(userId))) return { error: 'You are not part of this connection', status: 403 }
  const otherId = mine.find(id => id !== String(userId))
  return { connection, otherId }
}

function fmtSlot(d) {
  return new Date(d).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function postSystemNote(connectionId, senderId, text) {
  try {
    const convo = await Conversation.findOne({ connection: connectionId }).select('_id participants')
    if (!convo) return
    const receiver = (convo.participants || []).map(String).find(id => id !== String(senderId))
    await Message.create({ conversation: convo._id, sender: senderId, receiver, message: text })
    convo.lastMessageAt = new Date()
    await convo.save()
  } catch {
    // chat note is best-effort; the meeting record is source of truth
  }
}

/**
 * Propose a call: { connectionId, slots: [ISO...] (1-3, future), link?, note? }
 */
export async function proposeMeeting(req, res, next) {
  try {
    const { connectionId, slots, link = '', note = '' } = req.body
    const { connection, otherId, error, status } = await loadConnection(connectionId, req.user._id)
    if (error) return res.status(status).json({ success: false, message: error })

    const clean = [...new Set((Array.isArray(slots) ? slots : []).map(s => new Date(s).getTime()).filter(t => !Number.isNaN(t) && t > Date.now()))]
      .sort((a, b) => a - b)
      .slice(0, 3)
      .map(t => new Date(t))
    if (!clean.length) {
      return res.status(400).json({ success: false, message: 'Propose 1–3 future time slots' })
    }

    const meeting = await Meeting.create({
      connection: connection._id,
      proposedBy: req.user._id,
      slots: clean,
      link: String(link).slice(0, 500),
      note: String(note).slice(0, 500),
    })

    const label = clean.map(fmtSlot).join(' / ')
    await createNotification({
      recipient: otherId,
      type: 'meeting_proposed',
      title: 'Call proposed',
      message: `${req.user.name} proposed a call: ${label}`,
      relatedId: meeting._id,
      relatedModel: 'Meeting',
    })
    notifyUser(otherId, { build: u => templates.meetingProposed(u.name, req.user.name, label, meeting.link) }).catch(() => {})
    await postSystemNote(connection._id, req.user._id, `📞 ${req.user.name} proposed a call: ${label}`)

    res.status(201).json({ success: true, message: 'Call proposed', data: meeting })
  } catch (err) {
    next(err)
  }
}

/**
 * List meetings of a connection (participant only)
 */
export async function getConnectionMeetings(req, res, next) {
  try {
    const { error, status } = await loadConnection(req.params.connectionId, req.user._id)
    if (error) return res.status(status).json({ success: false, message: error })
    const meetings = await Meeting.find({ connection: req.params.connectionId })
      .populate('proposedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: meetings })
  } catch (err) {
    next(err)
  }
}

/**
 * Respond: { action: 'accept' (+slot ISO) | 'decline' | 'cancel' }
 * Accept/decline by the other party, cancel by the proposer.
 */
export async function respondMeeting(req, res, next) {
  try {
    const meeting = await Meeting.findById(req.params.id)
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' })

    const { connection, otherId, error, status } = await loadConnection(meeting.connection, req.user._id)
    if (error) return res.status(status).json({ success: false, message: error })
    if (meeting.status !== 'proposed') {
      return res.status(400).json({ success: false, message: `Meeting is already ${meeting.status}` })
    }

    const { action, slot } = req.body
    const me = String(req.user._id)
    const isProposer = String(meeting.proposedBy) === me

    if (action === 'cancel') {
      if (!isProposer) return res.status(403).json({ success: false, message: 'Only the proposer can cancel' })
      meeting.status = 'cancelled'
    } else if (action === 'accept' || action === 'decline') {
      if (isProposer) return res.status(403).json({ success: false, message: 'Wait for the other party to respond' })
      if (action === 'accept') {
        const picked = new Date(slot).getTime()
        const valid = meeting.slots.map(s => new Date(s).getTime())
        if (!valid.includes(picked)) {
          return res.status(400).json({ success: false, message: 'Pick one of the proposed slots' })
        }
        meeting.status = 'accepted'
        meeting.chosenSlot = new Date(picked)
      } else {
        meeting.status = 'declined'
      }
    } else {
      return res.status(400).json({ success: false, message: 'Unknown action' })
    }
    await meeting.save()

    const statusText = meeting.status === 'accepted'
      ? `Call confirmed for ${fmtSlot(meeting.chosenSlot)}${meeting.link ? ` — ${meeting.link}` : ''}`
      : meeting.status === 'declined'
        ? `${req.user.name} declined the proposed call`
        : `${req.user.name} cancelled the proposed call`
    const notifyTarget = isProposer ? otherId : meeting.proposedBy
    await createNotification({
      recipient: notifyTarget,
      type: meeting.status === 'accepted' ? 'meeting_accepted' : 'meeting_updated',
      title: meeting.status === 'accepted' ? 'Call confirmed' : 'Meeting update',
      message: statusText,
      relatedId: meeting._id,
      relatedModel: 'Meeting',
    })
    if (meeting.status === 'accepted') {
      notifyUser(notifyTarget, { build: u => templates.meetingAccepted(u.name, req.user.name, fmtSlot(meeting.chosenSlot), meeting.link) }).catch(() => {})
    }
    await postSystemNote(connection._id, req.user._id, `📞 ${statusText}`)

    res.json({ success: true, message: statusText, data: meeting })
  } catch (err) {
    next(err)
  }
}
