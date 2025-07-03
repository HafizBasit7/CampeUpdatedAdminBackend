// routes/orderRoutes.js

const express = require('express');
const orderRouter = express.Router();
const { getAllOrders, getOrderById } = require('../controllers/adminOrderController');

orderRouter.get('/getOrders', getAllOrders); // GET /api/orders
orderRouter.get('/getOrders/:orderId', getOrderById);

module.exports = orderRouter;
