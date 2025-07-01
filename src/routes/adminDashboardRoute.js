// routes/dashboard.js
const express = require('express');
const adminDashboardRouter = express.Router();
const { getDashboardStats ,getRecentActivities } = require('../controllers/adminDashboardController');

adminDashboardRouter.get('/', getDashboardStats);
adminDashboardRouter.get('/recentActivites', getRecentActivities);

module.exports = adminDashboardRouter;
