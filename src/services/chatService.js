import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Send a message
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} text - Message text
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async (senderId, receiverId, text) => {
  // Check if users are friends
  const senderUser = await User.findById(senderId);
  if (!senderUser.friends.includes(receiverId)) {
    throw new Error('You can only message friends');
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    text,
  });

  await message.populate('sender', 'name profilePhoto');
  await message.populate('receiver', 'name profilePhoto');

  return message;
};

/**
 * Get messages between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<Array>} Array of messages
 */
export const getMessages = async (userId1, userId2) => {
  // Check if users are friends
  const user1 = await User.findById(userId1);
  if (!user1.friends.includes(userId2)) {
    throw new Error('You can only view messages with friends');
  }

  const messages = await Message.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
  })
    .populate('sender', 'name profilePhoto')
    .populate('receiver', 'name profilePhoto')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    {
      sender: userId2,
      receiver: userId1,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return messages;
};

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversations
 */
export const getConversations = async (userId) => {
  // Get all unique users the current user has messaged with
  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate('sender', 'name profilePhoto isOnline')
    .populate('receiver', 'name profilePhoto isOnline')
    .sort({ createdAt: -1 });

  // Group by conversation partner
  const conversationsMap = new Map();

  messages.forEach((message) => {
    const partnerId =
      message.sender._id.toString() === userId.toString()
        ? message.receiver._id.toString()
        : message.sender._id.toString();

    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, {
        user:
          message.sender._id.toString() === userId.toString()
            ? message.receiver
            : message.sender,
        lastMessage: message,
        unreadCount: 0,
      });
    } else {
      const conversation = conversationsMap.get(partnerId);
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message;
      }
    }
  });

  // Count unread messages
  for (const [partnerId, conversation] of conversationsMap) {
    const unreadCount = await Message.countDocuments({
      sender: partnerId,
      receiver: userId,
      isRead: false,
    });
    conversation.unreadCount = unreadCount;
  }

  return Array.from(conversationsMap.values());
};

