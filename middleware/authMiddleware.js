const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    return res.json({
      message: 'Unauthorized',
      status: 401,
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.json({
        message: 'Unauthorized',
        status: 401,
      })
    }
    req.user = user
    next()
  })
}

module.exports = authenticateToken