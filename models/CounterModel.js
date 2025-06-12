// models/CounterModel.js
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const CounterModel = mongoose.model('Counter', counterSchema);
export default CounterModel;
