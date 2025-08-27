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
    address:{
      type:String,
      required:true
    },
    password: {
      type: String,
      required:false
    },
    image: {
      type: String,
      default: null,
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
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
