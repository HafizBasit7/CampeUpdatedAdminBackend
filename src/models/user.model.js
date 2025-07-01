
const { Schema, model } = require('mongoose');
const phoneNumberSchema = require('../common/phone-number.model');
const locationSchema = require('../common/location.model');

const authSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    zipCode: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    idCardNo: { type: String, required: true },
    drivingLicenseNo: { type: String, required: true },
    drivingLicenseIssueDate: { type: Date, required: true },
    profile: {
      phoneNumber: { type: phoneNumberSchema },
      location: { type: locationSchema },
      bio: { type: String, default: "Hi there, I'm CamperDooly user 👋", maxlength: 1000 },
      website: { type: String, default: 'N/A', maxlength: 1000 },
      linkedin: { type: String, default: 'N/A', maxlength: 200 },
      aboutMe: { type: String, default: 'N/A', maxlength: 1000 },
      profilePic: { type: String, default: 'https://static.thenounproject.com/png/4035892-200.png', maxlength: 400 },
      coverPhoto: { type: String, default: 'https://static.thenounproject.com/png/4035892-200.png', maxlength: 400 },
    },
    country: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'pending' },
  },
  { timestamps: true }
);

authSchema.index({ email: 1, emailVerified: 1 });

module.exports = model('user', authSchema);
