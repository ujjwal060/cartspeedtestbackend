import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      text: { type: String },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  sectionNumber: { type: Number, required: true },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
}, { timestamps: true });


const questionModel = mongoose.model('Question', questionSchema);
export default questionModel;