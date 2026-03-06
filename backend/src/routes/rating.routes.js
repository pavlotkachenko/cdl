/**
 * Rating Routes
 * Base path: /api/ratings
 */

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', ratingController.createRating);
router.get('/me', ratingController.getMyRating);
router.get('/attorney/:id', ratingController.getAttorneyRating);

module.exports = router;
