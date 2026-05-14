import mongoose from 'mongoose'

const requestStatusEnum = ['PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED', 'REOPENED']
const requestPriorityEnum = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const requestTypeEnum = ['ACADEMIC', 'FINANCE', 'HOSTEL', 'INFRASTRUCTURE', 'OTHER']

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
      enum: ['APPROVED', 'REJECTED', 'FORWARDED', 'ESCALATED', 'REOPENED'],
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
    ticketId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
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
      enum: requestTypeEnum,
      default: 'OTHER',
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
    priority: {
      type: String,
      enum: requestPriorityEnum,
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: requestStatusEnum,
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
    slaTargetHours: {
      type: Number,
      default: null,
      min: 1,
    },
    slaStartedAt: {
      type: Date,
      default: null,
    },
    slaDueAt: {
      type: Date,
      default: null,
      index: true,
    },
    nextEscalationAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastEscalatedAt: {
      type: Date,
      default: null,
    },
    escalationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resolutionFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      review: {
        type: String,
        trim: true,
        default: '',
        maxlength: 1000,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    reopenedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

requestSchema.index({ ticketId: 'text', title: 'text', description: 'text', category: 'text', subcategory: 'text' })
requestSchema.index({ status: 1, type: 1, createdAt: -1 })
requestSchema.index({ departmentId: 1, currentStep: 1, status: 1 })

export const Request = mongoose.model('Request', requestSchema)
