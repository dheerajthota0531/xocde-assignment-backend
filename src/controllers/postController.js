import * as postService from '../services/postService.js';
import { uploadFileToGCS } from '../utils/upload.js';

// @desc    Create a new post
// @route   POST /api/v1/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    // Upload files to GCS
    let imageUrl = '';
    let videoUrl = '';
    
    if (req.files?.image?.[0]) {
      imageUrl = await uploadFileToGCS(req.files.image[0]);
    }
    
    if (req.files?.video?.[0]) {
      videoUrl = await uploadFileToGCS(req.files.video[0]);
    }

    const post = await postService.createPost({
      userId: req.user._id,
      text,
      image: imageUrl,
      video: videoUrl,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/v1/posts
// @access  Private
export const getPosts = async (req, res, next) => {
  try {
    const posts = await postService.getAllPosts();

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/v1/posts/:id
// @access  Private
export const getPost = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/v1/posts/:id
// @access  Private (only post creator)
export const updatePost = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    const updateData = {};
    if (text !== undefined) updateData.text = text;
    
    // Upload new files to GCS if provided
    if (req.files?.image?.[0]) {
      updateData.image = await uploadFileToGCS(req.files.image[0]);
    }
    
    if (req.files?.video?.[0]) {
      updateData.video = await uploadFileToGCS(req.files.video[0]);
    }

    const post = await postService.updatePost(
      req.params.id,
      req.user._id,
      updateData
    );

    res.status(200).json({
      success: true,
      data: post,
      message: 'Post updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private (only post creator)
export const deletePost = async (req, res, next) => {
  try {
    await postService.deletePost(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
