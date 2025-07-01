
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const Camper = require('../models/camper.model');
const CamperForSale = require('../models/camperForSale.model');
const Booking = require('../models/booking.model');

exports.getUsers = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  const {
    page = 1,
    limit = 10,
    search = '',
    role,                        // admin | user (optional)
    status,                      // active | suspended | deleted (optional)
    sortBy = 'joinDate',         // name | email | joinDate | vehiclesUploaded | vehiclesBooked
    sortOrder = 'desc',          // asc | desc
  } = req.query;

  /* ------------------------------------------------------------------ */
  /* 1. Build Mongo filter (match)                                       */
  /* ------------------------------------------------------------------ */
  const match = {};

  // role filter  (?role=admin or ?role=user)
  if (role === 'admin') match.isAdmin = true;
  else if (role === 'user') match.isAdmin = false;

  // status filter
  if (status) match.accountStatus = status;

  // free‑text search on name/email
  if (search) {
    const regex = new RegExp(search, 'i');
    match.$or = [
      { firstName: regex },
      { lastName : regex },
      { email    : regex },
    ];
  }

  try {
    /* ---------------------------------------------------------------- */
    /* 2. Grab basic user docs                                          */
    /* ---------------------------------------------------------------- */
    const rawUsers = await User.find(match)
      .select('firstName lastName email isAdmin emailVerified accountStatus createdAt')
      .lean();

    /* ---------------------------------------------------------------- */
    /* 3. Enrich each user with vehicle counts                          */
    /* ---------------------------------------------------------------- */
    const enriched = await Promise.all(
      rawUsers.map(async (u) => {
        const vehiclesUploaded =
          (await Camper.countDocuments({ user: u._id })) +
          (await CamperForSale.countDocuments({ user: u._id }));

        const vehiclesBooked =
          await Booking.countDocuments({ user: u._id });

        return {
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.isAdmin ? 'admin' : 'user',
          status: u.accountStatus,
          verified: u.emailVerified,
         joinDate: u.createdAt ? new Date(u.createdAt).toISOString() : null,

          vehiclesUploaded,
          vehiclesBooked,
        };
      })
    );

    /* ---------------------------------------------------------------- */
    /* 4. Sort (client‑side) so we can include aggregated columns        */
    /* ---------------------------------------------------------------- */
    const sortKey = {
      name:              (u) => u.name.toLowerCase(),
      email:             (u) => u.email.toLowerCase(),
      joinDate:          (u) => u.joinDate,
      vehiclesUploaded:  (u) => u.vehiclesUploaded,
      vehiclesBooked:    (u) => u.vehiclesBooked,
    }[sortBy] || ((u) => u.joinDate);

    enriched.sort((a, b) => {
      const aVal = sortKey(a);
      const bVal = sortKey(b);
      const dir  = sortOrder === 'asc' ? 1 : -1;
      return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
    });

    /* ---------------------------------------------------------------- */
    /* 5. Pagination AFTER sorting                                       */
    /* ---------------------------------------------------------------- */
    const total = enriched.length;
    const start = (page - 1) * limit;
    const end   = start + Number(limit);
    const data  = enriched.slice(start, end);

    /* ---------------------------------------------------------------- */
    /* 6. Send response                                                  */
    /* ---------------------------------------------------------------- */
    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};



exports.updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.accountStatus = status;
    await user.save();
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
};
