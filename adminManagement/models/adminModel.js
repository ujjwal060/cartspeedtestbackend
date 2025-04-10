import mongoose from 'mongoose';

const AdminSuperAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    unique: true,
    required: function() {
      return this.role === 'admin';
    },
  },
  role: {
    type: String,
    enum: ['admin', 'superAdmin'],
    required: true,
  },
  location: {
    type: String,
    required: function() {
      return this.role === 'admin';
    }
  },
  refreshToken: {
    type: String,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpire: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const admin = mongoose.model('admin', AdminSuperAdminSchema);

export default admin;
