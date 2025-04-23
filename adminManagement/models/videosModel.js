import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  level: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  locationState: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const videos = mongoose.model('Video', videoSchema);
export default videos;