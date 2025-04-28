import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required:true
    },
    email: {
      type: String,
      required: false,
      unique: true,
    },
    mobile: {
      type: String,
      unique: false,
      sparse: true,
    },
    state: {
      type: String,
      required: true,
      default: null,
    },
    password: {
      type: String,
      required:false
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
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
