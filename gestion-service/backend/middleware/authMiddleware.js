const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.startsWith('Bearer ')
      ? authorization.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé, token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query(
      `SELECT id, nom, prenom, email, role, actif, created_at
       FROM utilisateurs
       WHERE id = ? AND actif = TRUE`,
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  next();
};

module.exports = { protect, restrictTo };
