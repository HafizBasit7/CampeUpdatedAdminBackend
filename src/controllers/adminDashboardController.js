const User = require('../models/user.model');
const Camper = require('../models/camper.model');
const Booking = require('../models/booking.model');

const getDashboardStats = async (req, res) => {
  try {
    // Exclude users with role 'admin'
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

    const totalVehicles = await Camper.countDocuments();
    const totalOrders = await Booking.countDocuments();

    const ongoingOrders = await Booking.countDocuments({ status: 'confirmed' });
    const completedOrders = await Booking.countDocuments({ status: 'completed' });
    const cancelledOrders = await Booking.countDocuments({ status: 'cancelled' });

    const earningsAgg = await Booking.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $lookup: {
          from: 'campers',
          localField: 'camper',
          foreignField: '_id',
          as: 'camperInfo'
        }
      },
      { $unwind: '$camperInfo' },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $multiply: ['$camperInfo.standardPrice', 0.1] } } // 10% commission
        }
      }
    ]);

    const earnedCommissions = earningsAgg[0]?.totalEarnings || 0;

    const pendingUsers = await User.countDocuments({ role: { $ne: 'admin' }, status: 'pending' });
    const pendingVehicles = await Camper.countDocuments({ status: 'pending' });
    const pendingOrders = await Booking.countDocuments({ status: 'pending' });

    return res.status(200).json({
      totalUsers,
      totalVehicles,
      totalOrders,
      ongoingOrders,
      completedOrders,
      cancelledOrders,
      earnedCommissions,
      dismissedCases: 0, // Placeholder
      newRequests: 0,    // Placeholder
      pendingOrders,
      pendingUsers,
      pendingVehicles
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
};



const getRecentActivities = async (req, res) => {
  try {
    // Fetch 5 most recent bookings (completed or cancelled)
    const recentBookings = await Booking.find({
      status: { $in: ['completed', 'cancelled'] }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('status updatedAt orderNumber user')
      .populate({
  path: 'user',
  select: 'firstName lastName'
})

    // Fetch 5 most recent users with active accountStatus
    const recentUsers = await User.find({ accountStatus: 'active', role: { $ne: 'admin' } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name updatedAt');

    // Fetch 5 most recent rejected vehicles
    const recentRejectedVehicles = await Camper.find({ status: 'rejected' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name updatedAt owner')
      .populate({ path: 'owner', select: 'name' });

    const activities = [];

    // Approved users
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_approved',
        user: user.name,
        time: user.updatedAt.toLocaleString(),
        status: 'approved'
      });
    });

    // Rejected vehicles
    recentRejectedVehicles.forEach(camper => {
      activities.push({
        type: 'vehicle_rejected',
        user: camper.owner?.name || 'Unknown',
        vehicleName: camper.name,
        time: camper.updatedAt.toLocaleString(),
        status: 'rejected'
      });
    });

    // Bookings (completed or cancelled)
    recentBookings.forEach(booking => {
      activities.push({
        type: booking.status === 'completed' ? 'order_completed' : 'order_cancelled',
        user: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Unknown',

        orderNumber: booking.orderNumber,
        time: booking.updatedAt.toLocaleString(),
        status: booking.status
      });
    });

    // Sort all activities by most recent time
    const sortedActivities = activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Return the 5 most recent
    res.status(200).json(sortedActivities.slice(0, 14));
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
};



module.exports = { getDashboardStats,getRecentActivities };
