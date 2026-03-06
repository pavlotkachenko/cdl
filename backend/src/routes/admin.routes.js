const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

const adminOnly = [authenticate, authorize('admin')];

router.get('/users', adminOnly, adminController.getUsers);
router.post('/users/invite', adminOnly, adminController.inviteUser);
router.patch('/users/:id/role', adminOnly, adminController.changeUserRole);
router.patch('/users/:id/suspend', adminOnly, adminController.suspendUser);
router.patch('/users/:id/unsuspend', adminOnly, adminController.unsuspendUser);

module.exports = router;
