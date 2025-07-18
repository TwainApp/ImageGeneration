# Twain Frontend

A React-based frontend for the Twain Couples Content Creator system.

## Features

- 🔐 Email/Password authentication (Admin only)
- 📝 Question group management with Firestore
- 🎯 Drag-and-drop reordering of question groups
- 🎬 Video generation triggers
- 📱 Responsive design with Tailwind CSS

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Email/Password authentication enabled in Firebase

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Update `src/firebase.ts` with your Firebase config
   - Enable Email/Password authentication in Firebase
   - Set up Firestore database
   - Create an admin user account in Firebase Authentication

3. Update GitHub Pages URL:
   - Edit `package.json` and change `homepage` to your GitHub Pages URL
   - Format: `https://yourusername.github.io/ImageGeneration`

### Development

Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Building for Production

Build the app:
```bash
npm run build
```

### Deployment to GitHub Pages

1. Install gh-pages:
```bash
npm install -g gh-pages
```

2. Deploy:
```bash
npm run deploy
```

## Firebase Configuration

You need to set up:

1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com)
2. **Authentication**: Enable Email/Password provider
3. **Firestore**: Create a database and set up security rules
4. **Web App**: Add a web app to get configuration
5. **Admin User**: Create an admin account in Firebase Authentication

### Required Environment Variables

Create a `.env` file in the docs directory:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Usage

1. **Login**: Use your admin email and password to authenticate
2. **Generate Questions**: Click "Generate New Questions" to create content
3. **Reorder**: Drag and drop question groups to change priority
4. **Generate Video**: Click "Generate Video" on any question group
5. **Manage**: Delete question groups you don't want

## Security

- **Admin Only**: Only you have access with your email/password
- **Firestore Rules**: Configure security rules to protect your data
- **Environment Variables**: Keep Firebase config secure

## Architecture

- **React 18** with TypeScript
- **Firebase** for backend services
- **Tailwind CSS** for styling
- **@dnd-kit** for drag-and-drop functionality
- **GitHub Pages** for hosting

## Backend Integration

The frontend is designed to work with the Python backend:
- Question generation triggers backend API calls
- Video generation uses the top question group
- Firestore stores question groups and user data
