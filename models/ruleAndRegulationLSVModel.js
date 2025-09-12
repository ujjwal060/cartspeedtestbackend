import mongoose from 'mongoose';




const guidelineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: false, default: null},
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  guidelines: [guidelineSchema]
});

const rulesAndRegulationSchema = new mongoose.Schema({
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  cartingRule: [sectionSchema],
  tips: [sectionSchema],
  safety: [sectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('RuleAndRagulationLSV', rulesAndRegulationSchema);