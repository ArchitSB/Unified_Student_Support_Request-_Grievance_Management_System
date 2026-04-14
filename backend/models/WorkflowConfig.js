import mongoose from 'mongoose'

const requestTypes = ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER']
const workflowRoles = ['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN']

const workflowStepSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: workflowRoles,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
)

const workflowConfigSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: true,
      enum: requestTypes,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    steps: {
      type: [workflowStepSchema],
      default: [],
      validate: {
        validator(value) {
          if (value.length === 0) return false
          const orders = value.map((step) => step.order)
          return new Set(orders).size === orders.length
        },
        message: 'Workflow steps must be non-empty and have unique order values',
      },
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

workflowConfigSchema.index({ requestType: 1, departmentId: 1, isActive: 1 })

export const WorkflowConfig = mongoose.model('WorkflowConfig', workflowConfigSchema)
