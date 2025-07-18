import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Twain API is running on Firebase Functions',
    environment: 'Firebase Functions'
  });
});

export const testConfig = functions.https.onRequest((request, response) => {
  const config = {
    openai_api_key_set: !!process.env.OPENAI_API_KEY,
    firebase_storage_bucket_set: !!process.env.FIREBASE_STORAGE_BUCKET,
    timestamp: new Date().toISOString()
  };
  response.json(config);
});

export const listVideos = functions.https.onRequest(async (request, response) => {
  try {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'queue/' });
    
    const videos = files
      .filter(file => file.name.endsWith('.mp4'))
      .map(file => ({
        name: file.name,
        url: file.publicUrl(),
        size: file.metadata.size,
        updated: file.metadata.updated
      }));
    
    response.json({
      success: true,
      videos,
      count: videos.length
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Additional functions for your Twain content generation workflow
export const generateContent = functions.https.onRequest(async (request, response) => {
  try {
    // TODO: Implement content generation logic
    response.json({
      success: true,
      message: 'Content generation endpoint ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const processVideo = functions.https.onRequest(async (request, response) => {
  try {
    // TODO: Implement video processing logic
    response.json({
      success: true,
      message: 'Video processing endpoint ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}); 