const mongoose = require('mongoose');
const User = require('../models/user.model');
const Camper      = require('../models/camper.model');
const Category = require('../models/category.model');

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
    const { ownerId } = req.params;
    const { search, status, fromDate, toDate } = req.query;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Valid ownerId is required in the URL.' });
    }

    // --- Build MongoDB query
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

    // --- Fetch vehicles with camperType populated
    const vehicles = await Camper.find(query)
      .populate({ path: 'camperType', select: 'name' })  // <<== Key line
      .sort({ updatedAt: -1 })
      .lean();

    // --- Fetch owner name once
    const owner = await User.findById(ownerId, 'firstName lastName').lean();
    const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown';

    // --- Shape final data
    const shaped = vehicles.map(v => ({
      id:            v._id,
      ownerId,
      ownerName,
      name:          v.name,
      type:          v.camperType?.name || 'Unknown', // <<== Now category name
      camperTypeId:  v.camperType?._id ?? null,
      location:      v.pickupLocation?.name || '',
       allowedCountry: v.allowedCountry || '', 
      status:        v.status,
      price:         v.standardPrice,
      lastUpdated:   v.updatedAt,
      ...v
    }));

    res.json(shaped);
  } catch (err) {
    next(err);
  }
};


// controllers/adminVehicles.controller.js
const STATUS_MAP = {
  approved  : 'active',     // <‑‑ your existing enum value
  pending   : 'pending',
  suspended : 'suspended',
  rejected  : 'rejected',
};

const updateVehicleStatus = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;   // NOTE: route uses :vehicleId
    const { status }    = req.body;     // e.g. "approved"

    if (!mongoose.Types.ObjectId.isValid(vehicleId))
      return res.status(400).json({ message: 'Invalid vehicle id.' });

    const normalised = String(status).toLowerCase();
    if (!STATUS_MAP[normalised])
      return res.status(400).json({ message: `Invalid status value.` });

    const updated = await Camper.findByIdAndUpdate(
      vehicleId,
      { status: STATUS_MAP[normalised] }, // save mapped value
      { new: true, runValidators: true }
    ).populate('camperType', 'name');

    if (!updated)
      return res.status(404).json({ message: 'Vehicle not found.' });

    res.json({ success: true, vehicle: updated });
  } catch (err) {
    next(err);            // your global error handler sends 500 + stack
  }
};



module.exports = {getUserCampersAndBookingStats, getVehiclesByOwner, updateVehicleStatus};