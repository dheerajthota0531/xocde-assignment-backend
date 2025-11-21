import multer from 'multer';
import { uploadToGCS } from './gcpStorage.js';

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'), false);
  }
};

// Use memory storage (we'll upload to GCS manually)
const storage = multer.memoryStorage();

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

/**
 * Upload file to GCP Storage
 * @param {Express.Multer.File} file - Multer file object
 * @returns {Promise<string>} Public URL of uploaded file
 */
export const uploadFileToGCS = async (file) => {
  if (!file) {
    return null;
  }

  try {
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const url = await uploadToGCS(
      file.buffer,
      file.originalname,
      folder,
      file.mimetype
    );
    return url;
  } catch (error) {
    console.error('Error uploading file to GCS:', error);
    throw error;
  }
};

export default upload;
