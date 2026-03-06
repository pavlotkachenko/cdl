/**
 * Rating Controller — thin handlers for rating endpoints.
 */

const ratingService = require('../services/rating.service');

exports.createRating = async (req, res) => {
  const { case_id, attorney_id, score, comment } = req.body;
  if (!case_id || !score) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'case_id and score are required' },
    });
  }

  try {
    const rating = await ratingService.createRating({
      driverId: req.user.id,
      caseId: case_id,
      attorneyId: attorney_id,
      score,
      comment,
    });
    res.status(201).json({ rating });
  } catch (err) {
    console.error('[RatingController] createRating:', err.message);
    const statusMap = {
      'Score must be between 1 and 5': 400,
      'Case not found': 404,
      'Unauthorized': 403,
      'Case must be resolved before rating': 422,
      'No attorney assigned to this case': 422,
    };
    const status = statusMap[err.message] || 500;
    res.status(status).json({ error: { code: 'RATING_ERROR', message: err.message } });
  }
};

exports.getMyRating = async (req, res) => {
  try {
    const result = await ratingService.getAttorneyRating(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('[RatingController] getMyRating:', err.message);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve ratings' },
    });
  }
};

exports.getAttorneyRating = async (req, res) => {
  try {
    const result = await ratingService.getAttorneyRating(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('[RatingController] getAttorneyRating:', err.message);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve ratings' },
    });
  }
};
