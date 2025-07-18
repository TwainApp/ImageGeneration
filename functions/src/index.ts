import { onRequest } from 'firebase-functions/v1/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import OpenAI from 'openai';

// Initialize Firebase Admin
initializeApp();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Twain prompts data structure (matching Python implementation)
const PROMPTS: Record<string, Record<string, string>> = {
  "Intimacy": {
    "light": "Ask a flirty or playful question about attraction, touch, or affection. Keep it light — something that makes your partner smile.",
    "medium": "Ask a question about what makes your partner feel close, desired, or connected. Something real but still comfortable to talk about.",
    "deep": "Ask something honest about boundaries, vulnerability, or how you both communicate around sex and intimacy. Keep it respectful and real."
  },
  "Connection": {
    "light": "Ask a sweet or quirky question about how your partner shows care — like their love language or favorite way to feel close.",
    "medium": "Ask a question about emotional needs or how your partner feels supported and understood in the relationship.",
    "deep": "Ask something honest about past relationship patterns, trust, or what helps your partner feel emotionally safe and loved."
  },
  "Memories": {
    "light": "Ask a fun or nostalgic question — like a favorite childhood memory or a 'what if' moment you both can laugh about.",
    "medium": "Ask about a meaningful memory you've shared or a dream you could build together in the future.",
    "deep": "Ask something reflective about turning points, personal growth, or how your partner sees their future unfolding."
  },
  "Everyday": {
    "light": "Ask something light and random — about habits, routines, or preferences that make your partner uniquely them.",
    "medium": "Ask a thoughtful question about how your partner sees the world, handles stress, or makes daily choices.",
    "deep": "Ask something reflective about identity, values, or what really matters most in life. Keep it open and honest."
  }
};

// Helper function to roll category and difficulty (matching Python implementation)
function rollCategoryAndDifficulty() {
  const categories = Object.keys(PROMPTS);
  const difficulties = ["light", "medium", "deep"];
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const prompt = PROMPTS[category][difficulty];
  
  return { category, difficulty, prompt };
}

// Generate questions using OpenAI (matching Python implementation)
async function generateQuestions(prompt: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a relationship expert helping couples get closer." },
        { role: "user", content: `${prompt} Give exactly 5 questions. Each must be under 200 characters. Do not number or bullet them. Keep the questions on one line each.` }
      ]
    });

    const content = response.choices[0].message.content?.trim() || "";
    const lines = content.split('\n')
      .map(line => line.trim().replace(/^[–-•\s]+/, '').trim())
      .filter(line => line.length > 0);

    if (lines.length === 1) {
      // Handle case where all questions are on one line
      const altSplit = lines[0].replace(/\\n/g, '\n').replace(/\?/g, '?\n').split('\n');
      const processedLines = altSplit.map(q => q.trim()).filter(q => q.length > 0);
      if (processedLines.length >= 5) {
        return processedLines.slice(0, 5);
      }
    }

    if (lines.length >= 5) {
      return lines.slice(0, 5);
    } else {
      console.warn(`Only got ${lines.length} valid questions: ${lines}`);
      return [];
    }
  } catch (error) {
    throw new Error(`OpenAI error: ${error}`);
  }
}

// Generate caption using OpenAI (matching Python implementation)
async function generateCaption(): Promise<string> {
  const prompt = (
    "Rewrite this social media caption in a fresh, casual way that still means the same thing: " +
    '"Questions to explore with your person 💬 Save these to talk through together later." ' +
    "Keep it short and modern. Do not mention any apps or brands. " +
    "Then add 3–5 relevant hashtags at the end, like #relationships #talktogether."
  );

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a social media copywriter for a relationship-focused account." },
        { role: "user", content: prompt }
      ]
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("GPT caption generation failed. Using fallback.");
    return (
      "Questions to explore with your person 💬 Save these to talk through together later. " +
      "#relationships #couplesgoals #talktogether #deepquestions"
    );
  }
}

export const listVideos = onRequest(async (request, response) => {
  try {
    // Verify authentication
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Authenticated user:', decodedToken.uid);
    } catch (authError) {
      console.error('Authentication error:', authError);
      response.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
      return;
    }

    const bucket = getStorage().bucket();
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

// Generate new question group (called from frontend "Generate New Questions" button)
export const generateQuestionGroup = onRequest(async (request, response) => {
  try {
    // Verify the request method
    if (request.method !== 'POST') {
      response.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
      return;
    }

    // Verify authentication
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Authenticated user:', decodedToken.uid);
    } catch (authError) {
      console.error('Authentication error:', authError);
      response.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
      return;
    }

    // Roll category and difficulty (matching Python batch generation)
    const { category, difficulty, prompt } = rollCategoryAndDifficulty();
    
    // Generate questions using OpenAI
    const questions = await generateQuestions(prompt);
    
    if (questions.length === 0) {
      response.status(500).json({
        success: false,
        error: 'Failed to generate questions'
      });
      return;
    }

    // Generate caption
    const caption = await generateCaption();

    // Create question group object for Firestore
    const questionGroup = {
      title: `New Question Set ${Date.now()}`,
      questions: questions,
      theme: category,
      difficulty: difficulty,
      createdAt: new Date(),
      order: 0, // Will be updated by frontend
      isActive: true,
      caption: caption
    };

    // Add to Firestore
    const db = getFirestore();
    const docRef = await db.collection('questionGroups').add(questionGroup);

    response.json({
      success: true,
      message: 'Question group generated successfully',
      questionGroup: {
        id: docRef.id,
        ...questionGroup
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating question group:', error);
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch generate multiple question groups (matching Python batch generation)
export const generateBatchQuestions = onRequest(async (request, response) => {
  try {
    // Verify the request method
    if (request.method !== 'POST') {
      response.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
      return;
    }

    // Verify authentication
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      console.log('Authenticated user:', decodedToken.uid);
    } catch (authError) {
      console.error('Authentication error:', authError);
      response.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
      return;
    }

    const { count = 10 } = request.body; // Default to 10 like Python script
    const generatedGroups = [];

    for (let i = 0; i < count; i++) {
      try {
        // Roll category and difficulty
        const { category, difficulty, prompt } = rollCategoryAndDifficulty();
        
        // Generate questions
        const questions = await generateQuestions(prompt);
        
        if (questions.length === 0) {
          console.warn(`Failed to generate questions for batch item ${i + 1}`);
          continue;
        }

        // Generate caption
        const caption = await generateCaption();

        // Create question group object
        const questionGroup = {
          title: `Batch Question Set ${Date.now()}_${i + 1}`,
          questions: questions,
          theme: category,
          difficulty: difficulty,
          createdAt: new Date(),
          order: i,
          isActive: true,
          caption: caption
        };

        // Add to Firestore
        const db = getFirestore();
        const docRef = await db.collection('questionGroups').add(questionGroup);
        
        generatedGroups.push({
          id: docRef.id,
          ...questionGroup
        });

        console.log(`Generated question group ${i + 1}/${count}: ${category} (${difficulty})`);
        
      } catch (error) {
        console.error(`Error generating batch item ${i + 1}:`, error);
        // Continue with next item instead of failing entire batch
      }
    }

    response.json({
      success: true,
      message: `Generated ${generatedGroups.length} question groups`,
      questionGroups: generatedGroups,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in batch generation:', error);
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const processVideo = onRequest(async (request, response) => {
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