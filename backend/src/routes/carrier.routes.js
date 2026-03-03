const express = require('express');
const router = express.Router();
const carrierController = require('../controllers/carrier.controller');

// POST /api/carriers/register
router.post('/register', carrierController.register);

module.exports = router;
