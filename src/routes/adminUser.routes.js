
const express = require('express');
const { param, query, body } = require('express-validator');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');
const adminUserController = require('../controllers/adminUser.controller');

// All routes here are protected & admin only
router.use(protect, adminOnly);

// GET /admin/users
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isIn(['admin', 'user']),
    query('status').optional().isIn(['active', 'suspended', 'deleted']),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  adminUserController.getUsers
);

// PATCH /admin/users/:id/status
router.patch(
  '/:id/',
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['active', 'suspended']),
    body('verified').optional().isBoolean(),
    body('role').optional().isIn(['admin', 'user']),
  ],
  adminUserController.updateUser 
);

module.exports = router;
