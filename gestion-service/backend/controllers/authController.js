const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont requis'
      });
    }

    const [users] = await pool.query(
      `SELECT id, nom, prenom, email, mot_de_passe, role
       FROM utilisateurs
       WHERE email = ? AND actif = TRUE`,
      [email]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, mot_de_passe, role } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être renseignés'
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUsers.length) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await pool.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role)
       VALUES (?, ?, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, role]
    );

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      data: {
        id: result.insertId,
        nom,
        prenom,
        email,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => res.status(200).json({
  success: true,
  data: req.user
});

module.exports = { login, register, getMe };
