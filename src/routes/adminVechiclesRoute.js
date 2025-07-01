const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {getUserCampersAndBookingStats, getVehiclesByOwner, updateVehicleStatus} = require('../controllers/adminVechicles.controller');
const vehiclesRouter = express.Router();
vehiclesRouter.get('/stats-by-owner', protect,adminOnly,getUserCampersAndBookingStats);
vehiclesRouter.get('/:ownerId', protect, adminOnly, getVehiclesByOwner);
// routes/adminVehicles.routes.js
vehiclesRouter.patch('/:vehicleId/status', protect, adminOnly, updateVehicleStatus);

module.exports = vehiclesRouter;
