// controllers/orderController.js

const Booking = require('../models/booking.model');
const Camper = require('../models/camper.model');
const User = require('../models/user.model');

const getAllOrders = async (req, res) => {
    try {
        const orderStatus = req.query.status || 'all';
        const bookings = await Booking.find()
            .populate({
                path: 'user',
                select: 'firstName lastName email'
            })
            .populate({
                path: 'camper',
                select: 'name licensePlate'
            })
            .sort({ createdAt: -1 }); // latest first

        let formattedOrders = bookings.map((booking) => ({
            id: booking._id,
            customerName: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`,
            carModel: booking.camper?.name || 'N/A',
            plateNumber: booking.camper?.licensePlate || 'N/A',
            status: booking.status,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));


        if (orderStatus != 'all') {
            formattedOrders = formattedOrders.filter((order) => order.status == orderStatus)
        }
        res.json({ success: true, data: formattedOrders });
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
