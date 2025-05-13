import mongoose from 'mongoose';

const videoProgressSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  watchedDuration: { type: String, default: 0 },
  isCompleted: { type: Boolean, default: false }
});

const sectionProgressSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  videos: [videoProgressSchema],
  isSectionCompleted: { type: Boolean, default: false }
});

const userLocationProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sections: [sectionProgressSchema]
}, { timestamps: true });

export default mongoose.model('UserVideoProgress', userLocationProgressSchema);
