import * as friendService from '../services/friendService.js';

// @desc    Send friend request
// @route   POST /api/v1/friends/request/:userId
// @access  Private
export const sendFriendRequest = async (req, res, next) => {
  try {
    const friendRequest = await friendService.sendFriendRequest(
      req.user._id,
      req.params.userId
    );

    res.status(201).json({
      success: true,
      data: friendRequest,
      message: 'Friend request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept friend request
// @route   PUT /api/v1/friends/accept/:requestId
// @access  Private
export const acceptFriendRequest = async (req, res, next) => {
  try {
    const friendRequest = await friendService.acceptFriendRequest(
      req.params.requestId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: friendRequest,
      message: 'Friend request accepted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject friend request
// @route   PUT /api/v1/friends/reject/:requestId
// @access  Private
export const rejectFriendRequest = async (req, res, next) => {
  try {
    await friendService.rejectFriendRequest(req.params.requestId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Friend request rejected',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friend requests (received)
// @route   GET /api/v1/friends/requests
// @access  Private
export const getFriendRequests = async (req, res, next) => {
  try {
    const friendRequests = await friendService.getFriendRequests(req.user._id);

    res.status(200).json({
      success: true,
      count: friendRequests.length,
      data: friendRequests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all friend requests (sent and received, all statuses)
// @route   GET /api/v1/friends/requests/all
// @access  Private
export const getAllFriendRequests = async (req, res, next) => {
  try {
    const friendRequests = await friendService.getAllFriendRequests(req.user._id);

    res.status(200).json({
      success: true,
      count: friendRequests.length,
      data: friendRequests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friends list
// @route   GET /api/v1/friends
// @access  Private
export const getFriends = async (req, res, next) => {
  try {
    const friends = await friendService.getFriends(req.user._id);

    res.status(200).json({
      success: true,
      count: friends.length,
      data: friends,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if users are friends
// @route   GET /api/v1/friends/check/:userId
// @access  Private
export const checkFriendship = async (req, res, next) => {
  try {
    const isFriends = await friendService.checkFriendship(
      req.user._id,
      req.params.userId
    );

    res.status(200).json({
      success: true,
      data: { isFriends },
    });
  } catch (error) {
    next(error);
  }
};
