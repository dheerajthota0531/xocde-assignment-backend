import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index to prevent duplicate requests
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// Index for faster queries
friendRequestSchema.index({ to: 1, status: 1 });
friendRequestSchema.index({ from: 1, status: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;

