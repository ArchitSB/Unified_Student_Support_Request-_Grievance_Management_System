import mongoose from 'mongoose'

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    universityId: {
      type: String,
      trim: true,
      default: undefined,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    program: {
      type: String,
      trim: true,
      default: null,
    },
    batch: {
      type: String,
      trim: true,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 20,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

studentProfileSchema.index({ department: 1, batch: 1 })
studentProfileSchema.index(
  { universityId: 1 },
  {
    unique: true,
    partialFilterExpression: { universityId: { $exists: true, $type: 'string' } },
  },
)

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema)
