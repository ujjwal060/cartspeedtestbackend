import mongoose from 'mongoose';

const userLocationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  });

userLocationSchema.index({ coordinates: '2dsphere' });

export default mongoose.model('UserLocation', userLocationSchema);
