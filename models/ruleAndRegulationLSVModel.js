import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  cartingRule: {
    type: String,
    required: true
  },
  tips: {
    type: String,
    required: true
  },
  safety: {
    type: String,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const guidelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

const rulesAndRegulationSchema = new mongoose.Schema({
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
  questions: questionSchema,
  sections: [sectionSchema],
  guidelines: [guidelineSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

 export default mongoose.model('RuleAndRagulationLSV', rulesAndRegulationSchema);