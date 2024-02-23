const jwt = require('jsonwebtoken');
const db = require('../database/db');

function privateMiddleware(req, res, next) {
  const authCookie = req.cookies['auth'];

  if (!authCookie) {
    return res.status(401).json({
      message: 'Unauthorized',
      status: 4011,
    });
  }
  if (authCookie) {
    // const token = authCookie && authCookie.split(' ')[1];

    jwt.verify(authCookie, process.env.JWT_SECRET, async (err, decoded) => {
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
        const isVerified = await db('users')
          .select('email_verify')
          .where('user_id', decoded.userId);

        if (isVerified.length === 0) {
          return res.status(403).json({
            message: 'Forbidden',
            status: 403,
          });
        }
        if (isVerified.length === 1) {
          if (isVerified[0]['email_verify'] === 0) {
            return res.status(403).json({
              status: 4031,
              message: 'Forbidden. Unverified email.',
            });
          }
          if (isVerified[0]['email_verify'] === 1) {
            req.userId = decoded.userId;
            next();
          }
        }
      }
    });
  }
}

function adminMiddleware(req, res, next) {
  const authCookie = req.cookies['auth'];

  if (!authCookie) {
    return res.status(401).json({
      message: 'Unauthorized',
      status: 4011,
    });
  }
  if (authCookie) {
    // const token = authCookie && authCookie.split(' ')[1];

    jwt.verify(authCookie, process.env.JWT_SECRET, async (err, decoded) => {
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
        const isAdmin = await db('users')
          .select('username')
          .where('role_id', 2)
          .where('user_id', decoded.userId);

        if (isAdmin.length === 0) {
          return res.status(403).json({
            message: 'Forbidden',
            status: 4032,
          });
        }
        if (isAdmin.length === 1) {
          req.userId = decoded.userId;
          next();
        }
      }
    });
  }
}

function privateUnverifiedMiddleware(req, res, next) {
  const authCookie = req.cookies['auth'];

  if (!authCookie) {
    return res.status(401).json({
      message: 'Unauthorized',
      status: 4011,
    });
  }
  if (authCookie) {
    // const token = authCookie && authCookie.split(' ')[1];

    jwt.verify(authCookie, process.env.JWT_SECRET, async (err, decoded) => {
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
        req.userId = decoded.userId;
        next();
      }
    });
  }
}

module.exports = {
  adminMiddleware,
  privateUnverifiedMiddleware,
  privateMiddleware,
};
