import mongoose from "mongoose";

const guidelineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const whatIsLSVsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  guidelines: [guidelineSchema]
});

const importanceSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  guidelines: [guidelineSchema]
});

const safetySectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  guidelines: [guidelineSchema]
});

const cartsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  guidelines: [guidelineSchema]
});

const goodLSVRulesSchema = new mongoose.Schema({
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  whatIsLSV: [whatIsLSVsectionSchema],
  importance: [importanceSectionSchema],
  safety: [safetySectionSchema],
  cart: [cartsectionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("GLSVRule", goodLSVRulesSchema);
