import mongoose from 'mongoose'

const approvalHistorySchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['TEACHER', 'HOD', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN', 'ADMIN'],
    },
    action: {
      type: String,
      required: true,
      enum: ['APPROVED', 'REJECTED', 'FORWARDED'],
    },
    remark: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const requestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER'],
      default: 'OTHER',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowConfig',
      default: null,
      index: true,
    },
    taggedTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    approvalHistory: {
      type: [approvalHistorySchema],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

requestSchema.index({ title: 'text', description: 'text' })
requestSchema.index({ status: 1, type: 1, createdAt: -1 })
requestSchema.index({ departmentId: 1, currentStep: 1, status: 1 })

export const Request = mongoose.model('Request', requestSchema)