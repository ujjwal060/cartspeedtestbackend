import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      text: { type: String },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  level: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  state: { type: String, required: true },
},{timestamps: true});

const questionModel = mongoose.model('Question', questionSchema);
export default questionModel;