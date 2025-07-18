import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionGroup } from '../types';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const SortableQuestionGroup: React.FC<{ questionGroup: QuestionGroup; onDelete: (id: string) => void; onGenerateVideo: (id: string) => void }> = ({ 
  questionGroup, 
  onDelete, 
  onGenerateVideo 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: questionGroup.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-md p-4 mb-3 cursor-move hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{questionGroup.title}</h3>
          <p className="text-sm text-gray-600">Theme: {questionGroup.theme} • Difficulty: {questionGroup.difficulty}</p>
          <div className="mt-4 flex flex-col gap-3">
            {questionGroup.questions.map((question, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5">{/* icon */} <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8a9 9 0 1118 0z" /></svg></span>
                <span className="text-gray-800 text-base">{question}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onGenerateVideo(questionGroup.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Generate Video
          </button>
          <button
            onClick={() => onDelete(questionGroup.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user || !user.uid) {
      setIsLoading(false);
      return;
    }

    // Reset retry count when user changes
    setRetryCount(0);
    setAuthError(null);

    // Wait for user to be fully authenticated before connecting to Firestore
    const connectToFirestore = async () => {
      try {
        // Force refresh the user's ID token to ensure it's current
        const token = await user.getIdToken(true);
        console.log('User authenticated, token refreshed');
        
        const q = query(collection(db, 'questionGroups'), orderBy('order', 'asc'));
        console.log('Setting up Firestore listener...');
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const groups = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Convert Firestore Timestamp to Date if it exists
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              // Ensure order is a number
              order: data.order || 0
            };
          }) as QuestionGroup[];
          console.log('Firestore data received:', groups.length, 'question groups');
          setQuestionGroups(groups);
          setIsLoading(false);
          setRetryCount(0); // Reset retry count on success
        }, (error) => {
          console.error('Firestore error:', error);
          setIsLoading(false);
          
          // Handle different error types
          if (error.code === 'permission-denied') {
            console.log('Permission denied - user may not be fully authenticated');
            setAuthError('Authentication error. Please try logging out and back in.');
          } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
            // Network or timeout errors - retry with exponential backoff
            handleRetry();
          } else {
            // Other errors - show error but don't retry
            setAuthError(`Connection error: ${error.message}`);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error refreshing token:', error);
        setIsLoading(false);
        setAuthError('Failed to authenticate. Please try again.');
        return () => {};
      }
    };

    const handleRetry = () => {
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        setIsRetrying(true);
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        
        console.log(`Retrying Firestore connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setIsRetrying(false);
          connectToFirestore();
        }, delay);
      } else {
        console.log('Max retries reached, stopping attempts');
        setAuthError('Failed to connect after multiple attempts. Please refresh the page.');
      }
    };

    const unsubscribe = connectToFirestore();
    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, [user, retryCount]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && user?.uid) {
      const oldIndex = questionGroups.findIndex(qg => qg.id === active.id);
      const newIndex = questionGroups.findIndex(qg => qg.id === over.id);
      
      const newOrder = arrayMove(questionGroups, oldIndex, newIndex);
      setQuestionGroups(newOrder);

      // Update order in Firestore
      for (let i = 0; i < newOrder.length; i++) {
        try {
          await updateDoc(doc(db, 'questionGroups', newOrder[i].id), {
            order: i
          });
        } catch (error) {
          console.error('Error updating question group order:', error);
        }
      }
    }
  };

  const handleGenerateNewQuestions = async () => {
    if (!user?.uid) {
      alert('Please log in to generate questions.');
      return;
    }
    
    setIsGenerating(true);
    try {
      // Ensure user has a fresh token
      const idToken = await user.getIdToken(true);
      console.log('Generating questions with token:', idToken.substring(0, 20) + '...');
      
      // Call Firebase function to generate new questions
      const response = await fetch('https://us-central1-twain-content-backend.cloudfunctions.net/generateQuestionGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Question group generated successfully:', result.questionGroup);
        // The Firestore listener will automatically update the UI
      } else {
        throw new Error(result.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestionGroup = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'questionGroups', id));
    } catch (error) {
      console.error('Error deleting question group:', error);
    }
  };

  const handleGenerateVideo = async (id: string) => {
    try {
      // This would trigger your Python backend to generate a video
      console.log('Generating video for question group:', id);
      alert('Video generation started! This will use the question group at the top of the list.');
    } catch (error) {
      console.error('Error generating video:', error);
    }
  };

  // Test function to check Firestore write permissions
  const testFirestoreWrite = async () => {
    try {
      const testDoc = {
        test: true,
        timestamp: new Date(),
        userId: user.uid
      };
      await addDoc(collection(db, 'test'), testDoc);
      console.log('Firestore write test successful');
      alert('Firestore write test successful!');
    } catch (error: any) {
      console.error('Firestore write test failed:', error);
      alert('Firestore write test failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Twain Dashboard</h1>
              <span className="text-sm text-gray-500">Welcome, {user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Question Groups</h2>
          <div className="flex space-x-2">
            <button
              onClick={testFirestoreWrite}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Test Firestore
            </button>
            <button
              onClick={handleGenerateNewQuestions}
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>Generate New Questions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Question Groups List */}
        <div className="bg-white rounded-lg shadow">
          {authError ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <p className="font-semibold">Connection Error</p>
                <p className="text-sm">{authError}</p>
                {retryCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Retry attempt {retryCount}/3
                  </p>
                )}
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setRetryCount(0);
                    setIsLoading(true);
                    // Force a page reload to re-authenticate
                    window.location.reload();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
                {retryCount < 3 && (
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setRetryCount(0);
                      setIsLoading(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          ) : isLoading || isRetrying ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>{isRetrying ? `Retrying connection... (${retryCount}/3)` : 'Loading question groups...'}</p>
            </div>
          ) : questionGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No question groups yet. Click "Generate New Questions" to get started!</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questionGroups.map(qg => qg.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-4">
                  {questionGroups.map((questionGroup) => (
                    <SortableQuestionGroup
                      key={questionGroup.id}
                      questionGroup={questionGroup}
                      onDelete={handleDeleteQuestionGroup}
                      onGenerateVideo={handleGenerateVideo}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Drag and drop question groups to reorder them</li>
            <li>• The top question group will be used for video generation</li>
            <li>• Click "Generate Video" to create content for TikTok/Instagram</li>
            <li>• Use "Generate New Questions" to create fresh content</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 