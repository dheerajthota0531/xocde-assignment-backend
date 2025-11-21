import * as chatService from '../services/chatService.js';

// @desc    Send a message
// @route   POST /api/v1/chat/message
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { receiver, text } = req.body;

    const message = await chatService.sendMessage(
      req.user._id,
      receiver,
      text
    );

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat messages with a user
// @route   GET /api/v1/chat/messages/:userId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const messages = await chatService.getMessages(
      req.user._id,
      req.params.userId
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat conversations
// @route   GET /api/v1/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user._id);

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};
