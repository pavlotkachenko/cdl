/**
 * Invoice Routes
 * Base path: /api/invoices
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/case/:id', invoiceController.getCaseInvoice);

module.exports = router;
