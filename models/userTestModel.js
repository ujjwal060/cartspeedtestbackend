import mongoose from 'mongoose';

const userTestAttemptsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    sectionNumber: {
        type: String,
        required: true,
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    questions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        selectedOption: {
            type: mongoose.Schema.Types.ObjectId
        },
        isCorrect: {
            type: Boolean
        }
    }],
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    isPassed: {
        type: Boolean,
        required: true
    },
    isSectionCompleted: {
        type: Boolean,
        default: false
    },
    nextSectionUnlocked: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// userTestAttemptsSchema.index({ userId: 1, locationId: 1, sectionId: 1 });
// userTestAttemptsSchema.index({ userId: 1, locationId: 1, sectionNumber: 1 });

const UserTestAttempts = mongoose.model('UserTestAttempts', userTestAttemptsSchema);
export default UserTestAttempts;