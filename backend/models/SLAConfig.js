import mongoose from 'mongoose'

const requestTypes = ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const slaConfigSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: requestTypes,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: priorities,
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    targetHours: {
      type: Number,
      required: true,
      min: 1,
    },
    warningHours: {
      type: Number,
      required: true,
      min: 1,
    },
    escalationHours: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

slaConfigSchema.index({ requestType: 1, priority: 1, departmentId: 1 }, { unique: true })

export const SLAConfig = mongoose.model('SLAConfig', slaConfigSchema)
