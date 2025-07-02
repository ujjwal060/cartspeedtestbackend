import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zipCode: { type: String, required: true, unique: true },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }
});

locationSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Location', locationSchema);
