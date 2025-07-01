
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/utils/errorHandler');

const adminAuthRoutes = require('./src/routes/adminAuth.routes');
const adminUserRoutes = require('./src/routes/adminUser.routes');
const admiVehiclesRouter = require('./src/routes/adminVechiclesRoute');
const adminDashboardRouter = require('./src/routes/adminDashboardRoute');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/admin', adminAuthRoutes);
app.use('/admin/users', adminUserRoutes);
app.use('/admin/vehicles',admiVehiclesRouter);
app.use('/admin/dashboard',adminDashboardRouter)
// app.use('/admin', adminAuthRoutes);

// Health check
app.get('/health', (_, res) => res.send({ status: 'ok', ts: Date.now() }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Admin backend running on port ${PORT}`));
});
