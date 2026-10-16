const levels = { error: 0, warn: 1, info: 2, debug: 3 }
const current = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase()
const currentLevel = levels[current] ?? levels.info

function format(level, msg, meta) {
  const ts = new Date().toISOString()
  const base = `[${ts}] ${level.toUpperCase()} ${msg}`
  if (meta && Object.keys(meta).length) return `${base} ${JSON.stringify(meta)}`
  return base
}
function log(level, msg, meta) {
  if ((levels[level] ?? 99) > currentLevel) return
  const line = format(level, msg, meta)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}
export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  http: (msg, meta) => log('info', msg, meta),
}
export default logger
