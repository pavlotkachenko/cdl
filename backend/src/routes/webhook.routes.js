const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { authenticate } = require('../middleware/auth');

router.get('/',     authenticate, webhookController.listWebhooks);
router.post('/',    authenticate, webhookController.createWebhook);
router.put('/:id',  authenticate, webhookController.updateWebhook);
router.delete('/:id', authenticate, webhookController.deleteWebhook);

module.exports = router;
