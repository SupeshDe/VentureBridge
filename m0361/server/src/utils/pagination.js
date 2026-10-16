import { PAGINATION_DEFAULTS } from '../config/constants.js'

export function parsePagination(query) {
  let page = Number.parseInt(query.page, 10)
  let limit = Number.parseInt(query.limit, 10)
  if (!Number.isFinite(page) || page < 1) page = PAGINATION_DEFAULTS.page
  if (!Number.isFinite(limit) || limit < 1) limit = PAGINATION_DEFAULTS.limit
  limit = Math.min(limit, PAGINATION_DEFAULTS.maxLimit)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
export function buildPaginationMeta(total, page, limit) {
  return { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 }
}
