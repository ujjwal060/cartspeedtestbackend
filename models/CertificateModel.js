import mongoose from 'mongoose';
const { Schema } = mongoose;

const certificateSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  certificateName: {
    type: String,
    required: true
  },
  certificateIssuedBy: {
    type: String,
    default: "CARTIE APP"
  },
  issueDate: {
    type: Date,
    required: true
  },
  status:{
    type:String,
    require:true,
    enum:['Active','Expired'],
    default:'Active'
  },
  certificateUrl: {
    type: String,
    required: false // Optional for now, will be generated later
  },
  validUntil: {
    type: Date,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Certificate', certificateSchema);
