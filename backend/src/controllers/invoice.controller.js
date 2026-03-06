/**
 * Invoice Controller — thin handlers for invoice endpoints.
 */

const invoiceService = require('../services/invoice.service');

exports.getCaseInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceByCase(
      req.params.id, req.user.id, req.user.role,
    );
    if (!invoice) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No invoice available for this case' },
      });
    }
    res.json({ invoice });
  } catch (err) {
    console.error('[InvoiceController] getCaseInvoice:', err.message);
    const statusMap = { 'Case not found': 404, 'Unauthorized': 403 };
    const status = statusMap[err.message] || 500;
    res.status(status).json({ error: { code: 'INVOICE_ERROR', message: err.message } });
  }
};
