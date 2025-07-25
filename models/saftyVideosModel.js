import mongoose from 'mongoose';

const saftyVideoSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: function () {
            return !this.isSuperAdmin;
        }
    },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    durationTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

const SafetyVideo = mongoose.model('SafetyVideo', saftyVideoSchema);
export default SafetyVideo;
