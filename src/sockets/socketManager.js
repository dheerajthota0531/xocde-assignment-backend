import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authService.js';
import * as chatService from '../services/chatService.js';
import * as friendService from '../services/friendService.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await authService.getUserById(decoded.userId);

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Update user online status using service
    await authService.updateUserOnlineStatus(socket.userId, true);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Join all friend rooms for notifications
    const friends = await friendService.getFriends(socket.userId);
    
    friends.forEach((friend) => {
      socket.join(`user_${friend._id}`);
    });

    // Get online friends and send to the newly connected user
    const onlineFriends = friends.filter(friend => friend.isOnline);
    if (onlineFriends.length > 0) {
      socket.emit('onlineFriendsList', {
        onlineUserIds: onlineFriends.map(f => f._id.toString())
      });
    }

    // Emit online status to friends
    friends.forEach((friend) => {
      io.to(`user_${friend._id}`).emit('userOnline', {
        userId: socket.userId,
        isOnline: true,
      });
    });

    // Handle sending message
    socket.on('sendMessage', async (data) => {
      try {
        const { receiver, text } = data;

        // Use service to send message (includes friend check)
        const message = await chatService.sendMessage(
          socket.userId,
          receiver,
          text
        );

        // Emit to receiver
        io.to(`user_${receiver}`).emit('newMessage', message);

        // Emit back to sender for confirmation
        socket.emit('messageSent', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { receiver, isTyping } = data;
      socket.to(`user_${receiver}`).emit('typing', {
        sender: socket.userId,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Update user offline status using service
      await authService.updateUserOnlineStatus(socket.userId, false);

      // Emit offline status to friends
      const friends = await friendService.getFriends(socket.userId);
      friends.forEach((friend) => {
        io.to(`user_${friend._id}`).emit('userOffline', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

