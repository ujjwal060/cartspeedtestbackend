import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    coordinates: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  });
  locationSchema.index({ coordinates: '2dsphere' });
  export default mongoose.model('Location', locationSchema);
  