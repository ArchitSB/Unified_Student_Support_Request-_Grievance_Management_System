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
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

requestCommentSchema.index({ requestId: 1, createdAt: -1 })

export const RequestComment = mongoose.model('RequestComment', requestCommentSchema)
