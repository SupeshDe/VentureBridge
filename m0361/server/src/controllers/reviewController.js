import Review from '../models/Review.js'
import Connection from '../models/Connection.js'
import User from '../models/User.js'
import { createNotification } from '../services/notificationService.js'

async function shareConnection(a, b) {
  return Connection.exists({
    $or: [
      { entrepreneur: a, investor: b },
      { entrepreneur: b, investor: a },
    ],
    status: 'active',
  })
}

/**
 * Average rating + count for a list of user ids. Returns a Map.
 */
export async function ratingSummaryFor(userIds) {
  const map = new Map()
  if (!userIds.length) return map
  const rows = await Review.aggregate([
    { $match: { reviewee: { $in: userIds } } },
    { $group: { _id: '$reviewee', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ])
  for (const r of rows) {
    map.set(String(r._id), { avg: Math.round(r.avg * 10) / 10, count: r.count })
  }
  return map
}

/**
 * Post (or update) a review. Reviewer must share an active connection
 * with the reviewee, and cannot review themselves.
 */
export async function upsertReview(req, res, next) {
  try {
    const { revieweeId, startupId, stars, text = '' } = req.body

    if (!revieweeId) {
      return res.status(400).json({ success: false, message: 'revieweeId is required' })
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Stars must be a whole number from 1 to 5' })
    }
    if (String(revieweeId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' })
    }

    const reviewee = await User.findById(revieweeId).select('_id')
    if (!reviewee) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const connected = await shareConnection(req.user._id, revieweeId)
    if (!connected) {
      return res.status(403).json({ success: false, message: 'You can only review people you are connected with' })
    }

    const review = await Review.findOneAndUpdate(
      { reviewer: req.user._id, reviewee: revieweeId },
      { startup: startupId || undefined, stars, text: String(text).slice(0, 500) },
      { new: true, upsert: true, runValidators: true }
    )

    await createNotification({
      recipient: revieweeId,
      type: 'review_received',
      title: `New ${stars}-star review`,
      message: `${req.user.name} rated you ${stars} out of 5`,
      relatedId: review._id,
      relatedModel: undefined,
    })

    res.status(201).json({ success: true, message: 'Review saved', data: review })
  } catch (error) {
    next(error)
  }
}

/**
 * Public reviews + summary for a user
 */
export async function getUserReviews(req, res, next) {
  try {
    const { default: mongoose } = await import('mongoose')
    let revieweeId = null
    try {
      revieweeId = new mongoose.Types.ObjectId(req.params.userId)
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid user id' })
    }

    const [reviews, summaryMap] = await Promise.all([
      Review.find({ reviewee: revieweeId })
        .populate('reviewer', 'name role')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      ratingSummaryFor([revieweeId]),
    ])
    res.json({
      success: true,
      data: { summary: summaryMap.get(String(revieweeId)) || { avg: 0, count: 0 }, reviews },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete my review
 */
export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, reviewer: req.user._id })
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }
    await review.deleteOne()
    res.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    next(error)
  }
}
