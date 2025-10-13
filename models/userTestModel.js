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
  userPhysicalLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLocation',
    required: true
  },
  attempts: [
    {
      attemptNumber: Number,
      questions: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
          },
          selectedOption: {
            type: mongoose.Schema.Types.ObjectId
          },
          isCorrect: Boolean
        }
      ],
      score: {
        type: Number,
        required: true
      },
      isPassed: {
        type: Boolean,
        required: true
      },
       duration: {
      type: Number,
      required: true
    },
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // isSectionCompleted: {
  //   type: Boolean,
  //   default: false
  // },
  // nextSectionUnlocked: {
  //   type: Boolean,
  //   default: false
  // },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userTestAttemptsSchema.index({ userId: 1, locationId: 1, userPhysicalLocationId: 1 });

const UserTestAttempts = mongoose.model('UserTestAttempts', userTestAttemptsSchema);
export default UserTestAttempts;