import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google Cloud Storage
let storage;
let bucket;
let initializationPromise = null;

// Initialize GCP Storage (async function to handle async operations)
const initializeGCPStorage = async () => {
  // Only initialize if required env vars are present and not placeholders
  const hasValidGCPConfig = 
    process.env.GCP_BUCKET_NAME && 
    process.env.GCP_PROJECT_ID 
 

  if (!hasValidGCPConfig) {
    console.warn('⚠️  GCP Storage not configured. Missing GCP_BUCKET_NAME or GCP_PROJECT_ID in .env');
    console.warn('⚠️  File uploads will not work until GCP Storage is configured');
    return;
  }

  try {
    // Option 1: Use service account key file
    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      const keyPath = path.resolve(__dirname, '../../', process.env.GCP_SERVICE_ACCOUNT_KEY);
      console.log('🔧 Initializing GCP Storage with service account key:', keyPath);
      
      // Check if file exists
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Service account key file not found: ${keyPath}`);
      }
      
      storage = new Storage({
        keyFilename: keyPath,
        projectId: process.env.GCP_PROJECT_ID,
      });
    }
    // Option 2: Use individual credentials
    else if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
      console.log('🔧 Initializing GCP Storage with credentials');
      storage = new Storage({
        credentials: {
          client_email: process.env.GCP_CLIENT_EMAIL,
          private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GCP_PROJECT_ID,
      });
    }
    // Option 3: Use default credentials (for GCP deployment)
    else {
      console.log('🔧 Initializing GCP Storage with default credentials');
      storage = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
      });
    }

    // Initialize bucket
    bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
    
    // Verify bucket exists and is accessible
    try {
      console.log(`🔍 Checking if bucket "${process.env.GCP_BUCKET_NAME}" exists...`);
      const [exists] = await bucket.exists();
      if (!exists) {
        console.error(`❌ Bucket "${process.env.GCP_BUCKET_NAME}" does not exist`);
        console.error('   Please create the bucket in Google Cloud Console:');
        console.error(`   https://console.cloud.google.com/storage/browser?project=${process.env.GCP_PROJECT_ID}`);
        bucket = null;
        return;
      }
      console.log(`✅ Bucket "${process.env.GCP_BUCKET_NAME}" exists and is accessible`);
      console.log(`✅ Google Cloud Storage initialized - Bucket: ${process.env.GCP_BUCKET_NAME}`);
      console.log(`✅ Bucket variable set successfully, ready for uploads`);
    } catch (checkError) {
      console.error(`❌ Error verifying bucket "${process.env.GCP_BUCKET_NAME}":`, checkError.message);
      console.error('   Error code:', checkError.code);
      console.error('   Error details:', checkError);
      console.error('\n   Possible issues:');
      console.error('   1. Bucket does not exist - Create it in Google Cloud Console');
      console.error('   2. Service account lacks permissions - Grant "Storage Admin" role');
      console.error('   3. Wrong project ID - Verify GCP_PROJECT_ID matches your project');
      console.error(`\n   Bucket URL: https://console.cloud.google.com/storage/browser?project=${process.env.GCP_PROJECT_ID}`);
      bucket = null;
    }
  } catch (error) {
    console.error('❌ Error initializing GCP Storage:', error.message);
    console.error('   Full error:', error);
    console.warn('⚠️  File uploads will not work until GCP Storage is configured');
    bucket = null;
  }
};

// Initialize immediately (but don't block)
// This will run when the module is imported
console.log('🚀 Starting GCP Storage initialization...');
initializationPromise = initializeGCPStorage()
  .then(() => {
    if (bucket) {
      console.log('✅ GCP Storage initialization completed successfully');
    } else {
      console.warn('⚠️  GCP Storage initialization completed but bucket is null');
    }
  })
  .catch((err) => {
    console.error('❌ Failed to initialize GCP Storage:', err.message);
    console.error('   Stack:', err.stack);
    bucket = null;
  });

// Export a function to check if GCP is ready
export const isGCPReady = () => {
  return bucket !== null && bucket !== undefined;
};

// Export a function to wait for GCP to be ready
export const waitForGCP = async (timeout = 10000) => {
  if (bucket) return true;
  if (!initializationPromise) return false;
  
  const startTime = Date.now();
  while (!bucket && (Date.now() - startTime) < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (initializationPromise) {
      try {
        await initializationPromise;
      } catch (err) {
        // Ignore errors, bucket will be null
      }
    }
  }
  return bucket !== null && bucket !== undefined;
};

/**
 * Upload file to Google Cloud Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} folder - Folder path (images or videos)
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} Public URL of uploaded file
 */
export const uploadToGCS = async (fileBuffer, fileName, folder, mimetype) => {
  // Wait for initialization to complete (with timeout)
  if (initializationPromise) {
    try {
      await Promise.race([
        initializationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        )
      ]);
    } catch (err) {
      if (err.message === 'Initialization timeout') {
        console.warn('⏱️  GCP initialization taking longer than expected...');
        // Continue anyway, bucket might be ready
      } else {
        console.error('❌ GCP Storage initialization failed:', err.message);
      }
    }
  }
  
  // Wait a bit more if bucket is still not ready
  if (!bucket) {
    console.log('⏳ Waiting for GCP Storage to initialize...');
    const ready = await waitForGCP(5000);
    if (!ready) {
      // Try to re-initialize if bucket is still null
      console.log('🔄 Re-attempting GCP Storage initialization...');
      initializationPromise = initializeGCPStorage().catch((err) => {
        console.error('❌ Failed to re-initialize GCP Storage:', err.message);
        bucket = null;
      });
      await initializationPromise;
    }
  }
  
  if (!bucket) {
    const errorMsg = `GCP Storage bucket not initialized. 
    
Configuration check:
- GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID || 'NOT SET'}
- GCP_BUCKET_NAME: ${process.env.GCP_BUCKET_NAME || 'NOT SET'}
- GCP_SERVICE_ACCOUNT_KEY: ${process.env.GCP_SERVICE_ACCOUNT_KEY || 'NOT SET'}

Please:
1. Verify your .env file has correct values
2. Ensure the bucket "${process.env.GCP_BUCKET_NAME}" exists in GCP
3. Check service account has Storage Admin permissions
4. Restart the server after making changes`;
    
    console.error('❌', errorMsg);
    throw new Error('GCP Storage bucket not initialized. Check server logs for details.');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(fileName);
    const uniqueFileName = `${folder}/${timestamp}-${randomString}${extension}`;

    // Create file reference
    const file = bucket.file(uniqueFileName);

    // Set metadata
    const metadata = {
      contentType: mimetype,
      metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    };

    // Upload file (without public ACL - uniform bucket-level access is enabled)
    await file.save(fileBuffer, {
      metadata,
    });

    // With uniform bucket-level access, we can't use makePublic() or per-object ACLs
    // The bucket itself must be configured for public access
    // Return the public URL (works if bucket has public read access)
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
    
    console.log(`✅ File uploaded to GCS: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to GCS:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Delete file from Google Cloud Storage
 * @param {string} fileUrl - Public URL of the file
 * @returns {Promise<void>}
 */
export const deleteFromGCS = async (fileUrl) => {
  if (!bucket) {
    throw new Error('GCP Storage bucket not initialized');
  }

  try {
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts.slice(4).join('/'); // Remove https://storage.googleapis.com/bucket-name/

    const file = bucket.file(fileName);
    await file.delete();
    
    console.log(`✅ File deleted from GCS: ${fileName}`);
  } catch (error) {
    console.error('❌ Error deleting from GCS:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 404) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
};

/**
 * Generate signed URL for private files (optional)
 * @param {string} fileName - File name in bucket
 * @param {number} expirationMinutes - URL expiration in minutes (default: 60)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (fileName, expirationMinutes = 60) => {
  if (!bucket) {
    throw new Error('GCP Storage bucket not initialized');
  }

  try {
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

export default { uploadToGCS, deleteFromGCS, getSignedUrl };

