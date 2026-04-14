import mongoose from 'mongoose'

const adminPermissions = [
  'REQUEST_REVIEW',
  'REQUEST_ASSIGN',
  'REQUEST_STATUS_UPDATE',
  'DASHBOARD_VIEW',
  'USER_MANAGE',
]

const adminProfileSchema = new mongoose.Schema(
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
    department: {
      type: String,
      trim: true,
      required: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Administrator',
    },
    permissions: {
      type: [String],
      enum: adminPermissions,
      default: ['REQUEST_REVIEW', 'REQUEST_ASSIGN', 'REQUEST_STATUS_UPDATE', 'DASHBOARD_VIEW'],
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

adminProfileSchema.index({ department: 1, isSuperAdmin: 1 })

export const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema)
