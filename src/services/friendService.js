import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';

/**
 * Send friend request
 * @param {string} fromUserId - Sender user ID
 * @param {string} toUserId - Receiver user ID
 * @returns {Promise<Object>} Friend request object
 */
export const sendFriendRequest = async (fromUserId, toUserId) => {
  // Can't send request to yourself
  if (toUserId === fromUserId.toString()) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check if target user exists
  const targetUser = await User.findById(toUserId);
  if (!targetUser) {
    throw new Error('User not found');
  }

  // Check if already friends
  const currentUser = await User.findById(fromUserId);
  if (currentUser.friends.includes(toUserId)) {
    throw new Error('Already friends');
  }

  // Check if request already exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { from: fromUserId, to: toUserId },
      { from: toUserId, to: fromUserId },
    ],
    status: 'pending',
  });

  if (existingRequest) {
    throw new Error('Friend request already exists');
  }

  // Create friend request
  const friendRequest = await FriendRequest.create({
    from: fromUserId,
    to: toUserId,
    status: 'pending',
  });

  await friendRequest.populate('from', 'name profilePhoto');
  await friendRequest.populate('to', 'name profilePhoto');

  return friendRequest;
};

/**
 * Accept friend request
 * @param {string} requestId - Friend request ID
 * @param {string} userId - User ID (receiver)
 * @returns {Promise<Object>} Updated friend request
 */
export const acceptFriendRequest = async (requestId, userId) => {
  const friendRequest = await FriendRequest.findById(requestId);

  if (!friendRequest) {
    throw new Error('Friend request not found');
  }

  // Check if current user is the receiver
  if (friendRequest.to.toString() !== userId.toString()) {
    throw new Error('Not authorized to accept this request');
  }

  // Check if already accepted
  if (friendRequest.status === 'accepted') {
    throw new Error('Friend request already accepted');
  }

  // Update request status
  friendRequest.status = 'accepted';
  await friendRequest.save();

  // Add to each other's friends list
  await User.findByIdAndUpdate(friendRequest.from, {
    $addToSet: { friends: friendRequest.to },
  });

  await User.findByIdAndUpdate(friendRequest.to, {
    $addToSet: { friends: friendRequest.from },
  });

  await friendRequest.populate('from', 'name profilePhoto');
  await friendRequest.populate('to', 'name profilePhoto');

  return friendRequest;
};

/**
 * Reject friend request
 * @param {string} requestId - Friend request ID
 * @param {string} userId - User ID (receiver)
 * @returns {Promise<void>}
 */
export const rejectFriendRequest = async (requestId, userId) => {
  const friendRequest = await FriendRequest.findById(requestId);

  if (!friendRequest) {
    throw new Error('Friend request not found');
  }

  // Check if current user is the receiver
  if (friendRequest.to.toString() !== userId.toString()) {
    throw new Error('Not authorized to reject this request');
  }

  // Update request status
  friendRequest.status = 'rejected';
  await friendRequest.save();
};

/**
 * Get friend requests for a user (received)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of friend requests
 */
export const getFriendRequests = async (userId) => {
  const friendRequests = await FriendRequest.find({
    to: userId,
    status: 'pending',
  })
    .populate('from', 'name profilePhoto')
    .sort({ createdAt: -1 });

  return friendRequests;
};

/**
 * Get all friend requests for a user (sent and received, all statuses)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of all friend requests
 */
export const getAllFriendRequests = async (userId) => {
  const friendRequests = await FriendRequest.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .populate('from', 'name profilePhoto')
    .populate('to', 'name profilePhoto')
    .sort({ createdAt: -1 });

  return friendRequests;
};

/**
 * Get friends list for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of friends
 */
export const getFriends = async (userId) => {
  const user = await User.findById(userId).populate(
    'friends',
    'name profilePhoto isOnline lastSeen'
  );

  return user.friends;
};

/**
 * Check if two users are friends
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if friends
 */
export const checkFriendship = async (userId1, userId2) => {
  const user = await User.findById(userId1);
  return user.friends.includes(userId2);
};

