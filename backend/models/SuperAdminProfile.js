import mongoose from 'mongoose'

const superAdminProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      trim: true,
      default: undefined,
      unique: true,
      sparse: true,
    },
    scope: {
      type: String,
      enum: ['GLOBAL'],
      default: 'GLOBAL',
    },
    accessLevel: {
      type: String,
      enum: ['ROOT', 'STANDARD'],
      default: 'ROOT',
    },
    managedModules: {
      type: [String],
      default: ['USERS', 'WORKFLOWS', 'DEPARTMENTS', 'ESCALATIONS', 'REPORTS'],
    },
  },
  {
    timestamps: true,
  },
)

export const SuperAdminProfile = mongoose.model('SuperAdminProfile', superAdminProfileSchema)
