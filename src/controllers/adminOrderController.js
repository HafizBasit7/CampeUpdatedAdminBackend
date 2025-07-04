// controllers/orderController.js

const Booking = require('../models/booking.model');
const Camper = require('../models/camper.model');
const User = require('../models/user.model');

// controllers/orderController.js

const getAllOrders = async (req, res) => {
  try {
    const orderStatus = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build base query
    const query = orderStatus === 'all' ? {} : { status: orderStatus };

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'camper',
        select: 'name licensePlate'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = bookings.map((booking) => ({
      id: booking._id,
      customerName: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`,
      carModel: booking.camper?.name || 'N/A',
      plateNumber: booking.camper?.licensePlate || 'N/A',
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        total
      }
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};


// Helper function
const formatOrder = (booking, camper, user) => {
    return {
        id: booking._id.toString(),
        customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User',
        carModel: camper?.name || 'Unknown Model',
        plateNumber: camper?.licensePlate || 'N/A',
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        totalAmount: camper
            ? camper.standardPrice + camper.cleaningFee + camper.deposit
            : 0,
        paymentStatus: 'Paid', // Stub: Change if you have actual field
        services: camper?.bookingType || [],
        notes: booking.notes || '',
    };
};

// Main controller function
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const booking = await Booking.findById(orderId)
            .populate('user')
            .populate('camper');

        if (!booking) {
            return res
                .status(404)
                .json({ success: false, message: 'Order not found' });
        }

        const formattedOrder = formatOrder(booking, booking.camper, booking.user);

        res.status(200).json({ success: true, data: formattedOrder });
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res
            .status(500)
            .json({ success: false, message: 'Failed to fetch order' });
    }
};




module.exports = {
    getAllOrders,
    getOrderById
};
