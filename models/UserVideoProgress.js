import mongoose from 'mongoose';

const userVideoProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  lastPlayedTime: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number,
  }
}, {
  timestamps: true,
});

userVideoProgressSchema.index({ userId: 1, locationId: 1, sectionId: 1, videoId: 1 }, { unique: true });

export default mongoose.model('UserVideoProgress', userVideoProgressSchema);
