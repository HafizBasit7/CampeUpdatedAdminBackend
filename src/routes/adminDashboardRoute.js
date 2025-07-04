// routes/dashboard.js
const express = require('express');
const adminDashboardRouter = express.Router();
const { getDashboardStats, getRecentActivities, getPendingItems, updateStatusForItem } = require('../controllers/adminDashboardController');

adminDashboardRouter.get('/', getDashboardStats);
adminDashboardRouter.get('/recentActivites', getRecentActivities);
adminDashboardRouter.get('/pending/:type', getPendingItems);
adminDashboardRouter.patch('/update-status/:type', updateStatusForItem);

module.exports = adminDashboardRouter;
