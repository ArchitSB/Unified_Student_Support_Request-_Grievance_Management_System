import mongoose from 'mongoose'

const escalationHistorySchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
    escalatedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    fromAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    toAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fromStage: {
      type: Number,
      required: true,
      min: 1,
    },
    toStage: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    mode: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      default: 'AUTO',
    },
  },
  {
    timestamps: true,
  },
)

escalationHistorySchema.index({ requestId: 1, createdAt: -1 })

export const EscalationHistory = mongoose.model('EscalationHistory', escalationHistorySchema)
