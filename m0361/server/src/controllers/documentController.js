import fs from 'fs'
import path from 'path'
import Document from '../models/Document.js'
import Startup from '../models/Startup.js'
import Connection from '../models/Connection.js'
import { UPLOAD_ROOT, typeOf, uploadSingle } from '../config/upload.js'

async function isConnectionParty(connectionId, userId) {
  if (!connectionId) return null
  const connection = await Connection.findById(connectionId).select('entrepreneur investor')
  if (!connection) return null
  const ids = [String(connection.entrepreneur), String(connection.investor)]
  return ids.includes(String(userId)) ? connection : false
}

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadSingle(req, res, err => (err ? reject(err) : resolve()))
  })
}

function publicDoc(doc) {
  return {
    id: doc._id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    category: doc.category,
    description: doc.description,
    visibility: doc.visibility,
    isVerified: doc.isVerified,
    owner: doc.owner && typeof doc.owner === 'object' ? { id: doc.owner._id, name: doc.owner.name } : undefined,
    createdAt: doc.createdAt,
  }
}

const CATEGORIES = ['pitch-deck', 'business-plan', 'financial', 'legal', 'other']
const VISIBILITY = ['private', 'connections', 'public']

/**
 * Upload a document (multipart `file` + fields category/description/visibility/startupId)
 */
export async function uploadDocument(req, res, next) {
  try {
    await runUpload(req, res)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attach a file to upload' })
    }

    const { category = 'other', description = '', visibility = 'private', startupId = '', connectionId = '' } = req.body

    if (!CATEGORIES.includes(category)) {
      fs.unlink(req.file.path, () => {})
      return res.status(400).json({ success: false, message: 'Invalid document category' })
    }
    if (!VISIBILITY.includes(visibility)) {
      fs.unlink(req.file.path, () => {})
      return res.status(400).json({ success: false, message: 'Invalid visibility' })
    }

    let startup = null
    if (startupId) {
      startup = await Startup.findOne({ _id: startupId, owner: req.user._id }).select('_id')
      if (!startup) {
        fs.unlink(req.file.path, () => {})
        return res.status(404).json({ success: false, message: 'Startup not found' })
      }
    }

    let connection = null
    if (connectionId) {
      connection = await isConnectionParty(connectionId, req.user._id)
      if (!connection) {
        fs.unlink(req.file.path, () => {})
        return res.status(404).json({ success: false, message: 'Connection not found' })
      }
    }

    const doc = await Document.create({
      owner: req.user._id,
      startup: startup?._id,
      connection: connection?._id,
      fileName: req.file.originalname,
      fileType: typeOf(req.file.originalname),
      fileUrl: `/api/documents/${'PENDING'}/file`,
      fileSize: req.file.size,
      category,
      description: String(description).slice(0, 500),
      visibility,
    })
    doc.fileUrl = `/api/documents/${doc._id}/file`
    await doc.save()

    // Keep the stored filename traceable to the record
    const finalPath = path.join(UPLOAD_ROOT, `${doc._id}${path.extname(req.file.originalname).toLowerCase()}`)
    fs.renameSync(req.file.path, finalPath)

    res.status(201).json({ success: true, message: 'Document uploaded', data: publicDoc(doc) })
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {})
    next(error)
  }
}

/**
 * List my documents
 */
export async function getMyDocuments(req, res, next) {
  try {
    const { category } = req.query
    const query = { owner: req.user._id }
    if (category) query.category = category
    const docs = await Document.find(query).sort({ createdAt: -1 }).lean()
    res.json({ success: true, data: docs.map(publicDoc) })
  } catch (error) {
    next(error)
  }
}

/**
 * List documents of a startup visible to the requester
 */
export async function getStartupDocuments(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.startupId).select('owner visibility isVerified').lean()
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }

    const isOwner = startup.owner.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    let connected = false
    if (!isOwner && !isAdmin) {
      connected = await Connection.exists({
        $or: [{ entrepreneur: req.user._id }, { investor: req.user._id }],
        startup: startup._id,
        status: 'active',
      })
    }

    const vis = ['public']
    if (connected || isOwner || isAdmin) vis.push('connections')
    if (isOwner || isAdmin) vis.push('private')

    const docs = await Document.find({ startup: startup._id, visibility: { $in: vis } })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: docs.map(publicDoc) })
  } catch (error) {
    next(error)
  }
}

/**
 * List files shared in a connection data room (participants only)
 */
export async function getConnectionDocuments(req, res, next) {
  try {
    const connection = await isConnectionParty(req.params.connectionId, req.user._id)
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' })
    }
    const docs = await Document.find({ connection: connection._id })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: docs.map(publicDoc) })
  } catch (error) {
    next(error)
  }
}

/**
 * Download a document (enforces the same visibility rules)
 */
export async function downloadDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id).populate('startup', 'owner visibility')
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    const isOwner = doc.owner.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    let allowed = isOwner || isAdmin || doc.visibility === 'public'
    if (!allowed && doc.connection) {
      allowed = Boolean(await isConnectionParty(doc.connection._id || doc.connection, req.user._id))
    }
    if (!allowed && doc.visibility === 'connections' && doc.startup) {
      allowed = await Connection.exists({
        $or: [{ entrepreneur: req.user._id }, { investor: req.user._id }],
        startup: doc.startup._id,
        status: 'active',
      })
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have access to this document' })
    }

    const filePath = path.join(UPLOAD_ROOT, `${doc._id}${path.extname(doc.fileName).toLowerCase()}`)
    if (!fs.existsSync(filePath)) {
      return res.status(410).json({ success: false, message: 'File is no longer stored on the server' })
    }
    res.download(filePath, doc.fileName)
  } catch (error) {
    next(error)
  }
}

/**
 * Delete my document (removes record + stored file)
 */
export async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id })
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }
    const filePath = path.join(UPLOAD_ROOT, `${doc._id}${path.extname(doc.fileName).toLowerCase()}`)
    fs.unlink(filePath, () => {})
    // Unlink pitch decks pointing at this file
    await Startup.updateMany({ pitchDeckUrl: doc.fileUrl }, { $unset: { pitchDeckUrl: '' } })
    await doc.deleteOne()
    res.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    next(error)
  }
}

/**
 * Admin: list all documents with owner info
 */
export async function adminListDocuments(req, res, next) {
  try {
    const { page = 1, limit = 20, category } = req.query
    const query = {}
    if (category) query.category = category
    const skip = (Number(page) - 1) * Number(limit)
    const [docs, total] = await Promise.all([
      Document.find(query).populate('owner', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Document.countDocuments(query),
    ])
    res.json({ success: true, data: docs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } })
  } catch (error) {
    next(error)
  }
}

/**
 * Admin: remove any document
 */
export async function adminDeleteDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }
    const filePath = path.join(UPLOAD_ROOT, `${doc._id}${path.extname(doc.fileName).toLowerCase()}`)
    fs.unlink(filePath, () => {})
    await Startup.updateMany({ pitchDeckUrl: doc.fileUrl }, { $unset: { pitchDeckUrl: '' } })
    await doc.deleteOne()
    res.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    next(error)
  }
}
