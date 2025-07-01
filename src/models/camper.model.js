
const { Schema, model } = require('mongoose');
const attachmentSchema = require('../common/attachment.model');
const locationSchema = require('../common/location.model');

const camperSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  status: { type: String, enum: ['pending','active','sold', 'suspended', 'rejected'], default: 'active' },
  bookingType: { type: [String], enum: ['direct','regular'], required: true },
  camperType: { type: Schema.Types.ObjectId, ref: 'category', required: true },
  thumbnailImage: { type: String, required: true },
  images: { type: [attachmentSchema], required: true },
  approvalDate: { type: Date },
  licensePlate: { type: String, required: true },
  allowedCountry: { type: String, required: true },
  licenseType: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  pickupLocation: { type: locationSchema, required: true },
  maintenanceDays: { type: Number, required: true },
  standardPrice: { type: Number, required: true },
  minimumRentalDays: { type: Number, required: true },
  cleaningFee: { type: Number, required: true },
  deposit: { type: Number, required: true },
  cancellationPolicy: { type: String, enum: ['mild','moderate','strict'], required: true },
}, { timestamps: true });

module.exports = model('camper', camperSchema);
