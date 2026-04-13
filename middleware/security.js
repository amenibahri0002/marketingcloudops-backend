const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')

// Protection headers HTTP
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
})

// Rate limiting global — 100 requêtes par 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requêtes, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting login — 5 tentatives par 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting inscription — 10 par heure
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Trop d inscriptions, réessayez dans 1 heure' },
  standardHeaders: true,
  legacyHeaders: false
})

// Validation login
const validateLogin = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6 caractères)')
    .trim()
]

// Validation register
const validateRegister = [
  body('name')
    .notEmpty().withMessage('Nom requis')
    .isLength({ min: 2, max: 100 }).withMessage('Nom entre 2 et 100 caractères')
    .trim()
    .escape(),
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6 caractères)')
    .trim()
]

// Validation contact
const validateContact = [
  body('name')
    .notEmpty().withMessage('Nom requis')
    .trim().escape(),
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Numéro de téléphone invalide')
]

// Middleware de vérification des erreurs de validation
const checkValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    })
  }
  next()
}

module.exports = {
  helmetMiddleware,
  globalLimiter,
  loginLimiter,
  registerLimiter,
  validateLogin,
  validateRegister,
  validateContact,
  checkValidation
}