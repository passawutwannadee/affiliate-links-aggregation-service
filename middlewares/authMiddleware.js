const jwt = require('jsonwebtoken');

function privateMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      message: 'Unauthorized',
      status: 4011,
    });
  }
  if (authHeader) {
    console.log('test4');
    const token = authHeader && authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token verification failed
        if (err.name === 'TokenExpiredError') {
          // Token expired
          return res.status(401).json({
            message: 'Unauthorized',
            status: 4012,
          });
        } else if (err.name === 'JsonWebTokenError') {
          // Invalid token
          return res.status(401).json({
            message: 'Unauthorized',
            status: 4013,
          });
        } else {
          // Other errors
          console.error('JWT verification error:', err.message);
        }
      } else {
        // Token is valid, 'decoded' contains the decoded payload
        req.userId = decoded.userId;
        next();
      }
    });
  }
}

function publicMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decode.userId;
    next();
  } else {
    next();
  }
}

module.exports = {
  publicMiddleware,
  privateMiddleware,
};
