const DUPLICATE_KEY_CODES = new Set([11000, 11001, 12582])

export function isDuplicateKeyError(error) {
  const pending = [error]
  const visited = new Set()

  while (pending.length) {
    const current = pending.pop()
    if (!current || typeof current !== 'object' || visited.has(current)) continue
    visited.add(current)

    if (DUPLICATE_KEY_CODES.has(Number(current.code))) return true
    if (/\bE1100[01]\b|\bduplicate key\b/i.test(current.message || '')) return true

    if (current.err) pending.push(current.err)
    if (current.cause) pending.push(current.cause)
    if (Array.isArray(current.writeErrors)) pending.push(...current.writeErrors)
    if (Array.isArray(current.errors)) pending.push(...current.errors)
  }

  return false
}

export function duplicateKeyFields(error) {
  const pending = [error]
  const visited = new Set()

  while (pending.length) {
    const current = pending.pop()
    if (!current || typeof current !== 'object' || visited.has(current)) continue
    visited.add(current)

    const fields = Object.keys(current.keyPattern || current.keyValue || {})
    if (fields.length) return fields

    if (current.err) pending.push(current.err)
    if (current.cause) pending.push(current.cause)
    if (Array.isArray(current.writeErrors)) pending.push(...current.writeErrors)
    if (Array.isArray(current.errors)) pending.push(...current.errors)
  }

  return []
}
