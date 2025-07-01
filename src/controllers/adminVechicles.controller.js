const mongoose = require('mongoose');
const User = require('../models/user.model');
const Camper      = require('../models/camper.model');

const getUserCampersAndBookingStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isAdmin: { $ne: true } } },
      {
        $lookup: {
          from: 'campers',
          localField: '_id',
          foreignField: 'user',
          as: 'campers'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          let: { camperIds: '$campers._id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$camper', '$$camperIds'] }
              }
            }
          ],
          as: 'bookings'
        }
      },
      {
        $addFields: {
          totalCampers: { $size: '$campers' },
          totalBookings: { $size: '$bookings' },
          
          pending: {
            $size: {
              $filter: {
                input: '$bookings',
                as: 'b',
                cond: { $eq: ['$$b.status', 'pending'] }
              }
            }
          },
          confirmed: {
            $size: {
              $filter: {
                input: '$bookings',
                as: 'b',
                cond: { $eq: ['$$b.status', 'confirmed'] }
              }
            }
          },
          cancelled: {
            $size: {
              $filter: {
                input: '$bookings',
                as: 'b',
                cond: { $eq: ['$$b.status', 'cancelled'] }
              }
            }
          },
          completed: {
            $size: {
              $filter: {
                input: '$bookings',
                as: 'b',
                cond: { $eq: ['$$b.status', 'completed'] }
              }
            }
          }
        }
      },
      
      {
        $project: {
          _id: 0,
          ownerId: '$_id',
          ownerName: { $concat: ['$firstName', ' ', '$lastName'] },
          isAdmin: '$isAdmin',
          totalCampers: 1,
          totalBookings: 1,
          pending: 1,
          confirmed: 1,
          cancelled: 1,
          completed: 1
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getVehiclesByOwner = async (req, res, next) => {
  try {
    const { ownerId } = req.params; // Changed from req.query to req.params
    const { search, status, fromDate, toDate } = req.query; // Other filters can stay as query params

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Valid ownerId is required in the URL.' });
    }

    /* ---------- build Mongo query ---------- */
    const query = { user: ownerId };

    if (search)
      query.name = { $regex: search.trim(), $options: 'i' };

    if (status)
      query.status = status;

    if (fromDate || toDate) {
      query.updatedAt = {};
      if (fromDate) query.updatedAt.$gte = new Date(fromDate);
      if (toDate)   query.updatedAt.$lte = new Date(toDate);
    }

    /* ---------- fetch vehicles ---------- */
    const vehicles = await Camper.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    /* ---------- attach ownerName once ---------- */
    const owner = await User.findById(ownerId, 'firstName lastName').lean();
    const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown';

    const shaped = vehicles.map(v => ({
      id:            v._id,
      ownerId,
      ownerName,
      name:          v.name,
      type:          v.camperType,
      location:      v.pickupLocation?.city ?? '',
      status:        v.status,
      price:         v.standardPrice,
      lastUpdated:   v.updatedAt,
      /* everything VehicleDetailsDialog needs: */
      ...v
    }));

    res.json(shaped);
  } catch (err) {
    next(err);
  }
};

module.exports = {getUserCampersAndBookingStats, getVehiclesByOwner};