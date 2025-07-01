const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {getUserCampersAndBookingStats, getVehiclesByOwner} = require('../controllers/adminVechicles.controller');
const vehiclesRouter = express.Router();
vehiclesRouter.get('/stats-by-owner', protect,adminOnly,getUserCampersAndBookingStats);
vehiclesRouter.get('/:ownerId', protect, adminOnly, getVehiclesByOwner);
module.exports = vehiclesRouter;
