import mongoose from 'mongoose'

const requestCommentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RequestComment',
      default: null,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'INTERNAL_ONLY'],
      default: 'PUBLIC',
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    mentions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

requestCommentSchema.index({ requestId: 1, createdAt: -1 })
requestCommentSchema.index({ requestId: 1, parentCommentId: 1, createdAt: 1 })

export const RequestComment = mongoose.model('RequestComment', requestCommentSchema)
