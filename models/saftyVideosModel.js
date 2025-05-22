import mongoose from 'mongoose';

const saftyVideoSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    durationTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
})

const safityVideo = mongoose.model('safityVideo', saftyVideoSchema);
export default safityVideo;