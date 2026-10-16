export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source]
    const result = schema.safeParse(data)
    if (!result.success) {
      const details = result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      return res.status(400).json({ success: false, message: 'Validation failed', details, requestId: req.id })
    }
    req[source] = result.data
    next()
  }
}
