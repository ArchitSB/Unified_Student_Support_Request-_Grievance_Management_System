import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 20,
      unique: true,
      index: true,
    },
    hodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    teachers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

departmentSchema.index({ name: 1 }, { unique: true })

export const Department = mongoose.model('Department', departmentSchema)
