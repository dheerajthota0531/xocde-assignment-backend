import Post from '../models/Post.js';
import User from '../models/User.js';

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @param {string} postData.userId - User ID
 * @param {string} postData.text - Post text
 * @param {string} postData.image - Image URL
 * @param {string} postData.video - Video URL
 * @returns {Promise<Object>} Created post
 */
export const createPost = async ({ userId, text, image, video }) => {
  // Validate that at least one field is provided
  if (!text && !image && !video) {
    throw new Error('Post must contain text, image, or video');
  }

  const post = await Post.create({
    user: userId,
    text: text || '',
    image: image || '',
    video: video || '',
  });

  // Populate user info
  await post.populate('user', 'name profilePhoto');

  return post;
};

/**
 * Get all posts
 * @returns {Promise<Array>} Array of posts
 */
export const getAllPosts = async () => {
  const posts = await Post.find()
    .populate('user', 'name profilePhoto')
    .sort({ createdAt: -1 });

  return posts;
};

/**
 * Get post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} Post object
 */
export const getPostById = async (postId) => {
  const post = await Post.findById(postId).populate(
    'user',
    'name profilePhoto'
  );

  if (!post) {
    throw new Error('Post not found');
  }

  return post;
};

/**
 * Update post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated post
 */
export const updatePost = async (postId, userId, updateData) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Post not found');
  }

  // Check if user is the post creator
  if (post.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this post');
  }

  // Update fields
  if (updateData.text !== undefined) post.text = updateData.text;
  if (updateData.image) post.image = updateData.image;
  if (updateData.video) post.video = updateData.video;

  await post.save();
  await post.populate('user', 'name profilePhoto');

  return post;
};

/**
 * Delete post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<void>}
 */
export const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error('Post not found');
  }

  // Check if user is the post creator
  if (post.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this post');
  }

  await Post.findByIdAndDelete(postId);
};

