import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      text: { type: String },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  locationId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: function () {
      return true
    }
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  isSuperAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });


const questionModel = mongoose.model('Question', questionSchema);
export default questionModel;