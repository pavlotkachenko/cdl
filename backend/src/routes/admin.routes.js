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

// Assignment request approval flow (OC-7)
router.get('/assignment-requests', adminOnly, adminController.getAssignmentRequests);
router.post('/assignment-requests/:requestId/approve', adminOnly, adminController.approveAssignmentRequest);
router.post('/assignment-requests/:requestId/reject', adminOnly, adminController.rejectAssignmentRequest);

// Staff management
router.get('/staff', adminOnly, adminController.getStaff);
router.get('/staff/:id', adminOnly, adminController.getStaffMember);
router.patch('/staff/:id', adminOnly, adminController.updateStaffMember);

// Dashboard (AC-1)
router.get('/dashboard/stats', adminOnly, adminController.getDashboardStats);
router.get('/workload', adminOnly, adminController.getWorkloadDistribution);
router.get('/charts/:type', adminOnly, adminController.getChartData);

// Cases — admin-wide (AC-1)
router.get('/cases', adminOnly, adminController.getAllCases);
router.get('/cases/:id', adminOnly, adminController.getAdminCaseDetail);
router.patch('/cases/:id/status', adminOnly, adminController.updateCaseStatus);

// Operators (AC-1)
router.get('/operators', adminOnly, adminController.getOperators);

// Client management
router.get('/clients', adminOnly, adminController.getAllClients);
router.get('/clients/:id', adminOnly, adminController.getClient);
router.patch('/clients/:id', adminOnly, adminController.updateClient);

// Staff performance
router.get('/performance', adminOnly, adminController.getStaffPerformance);

module.exports = router;
