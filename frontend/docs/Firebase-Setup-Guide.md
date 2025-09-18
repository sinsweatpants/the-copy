# Firebase Setup Guide

This guide explains how Firebase is configured and used in the project.

## Firebase Configuration

Firebase has been configured with the following settings:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBkeea3ffQjhQ6xlnRAXC38kdG7trXvmZc",
  authDomain: "adam-468522.firebaseapp.com",
  projectId: "adam-468522",
  storageBucket: "adam-468522.firebasestorage.app",
  messagingSenderId: "781031989535",
  appId: "1:781031989535:web:a67d962d7c8bcb3cc2d02a",
  measurementId: "G-W24SMTG90M"
};
```

## File Structure

The Firebase configuration is located in:
- `frontend/src/lib/firebase.ts` - Main Firebase initialization file
- `frontend/src/services/firebaseService.ts` - Service layer for Firebase products
- `frontend/src/components/FirebaseTest.tsx` - Test component to verify initialization
- `frontend/src/components/FirebaseDemo.tsx` - Demo component showing Firebase features

## Firebase Products Used

The following Firebase products have been integrated:

1. **Firebase App** - Core initialization
2. **Firebase Analytics** - Analytics tracking
3. **Firebase Authentication** - User authentication
4. **Firebase Firestore** - NoSQL database
5. **Firebase Storage** - File storage

## How to Use Firebase Services

### Authentication

```typescript
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

// Sign in anonymously
const user = await signInAnonymously(auth);
```

### Firestore

```typescript
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Add a document
const docRef = await addDoc(collection(db, "users"), {
  name: "John Doe",
  email: "john@example.com"
});

// Get documents
const querySnapshot = await getDocs(collection(db, "users"));
```

### Storage

```typescript
import { storage } from '../lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Upload a file
const storageRef = ref(storage, 'images/profile.jpg');
await uploadString(storageRef, fileContent, 'raw');
const url = await getDownloadURL(storageRef);
```

## Service Layer

We've created a service layer in `firebaseService.ts` that provides simplified functions for common Firebase operations:

- `signInAnonymouslyUser()` - Sign in anonymously
- `onUserStateChanged()` - Listen for auth state changes
- `addDocument()` - Add a document to Firestore
- `getDocuments()` - Get documents from Firestore
- `uploadFile()` - Upload a file to Storage

## Testing Firebase

The FirebaseTest component displays initialization status and includes the FirebaseDemo component for interactive testing of Firebase features.

## Troubleshooting

If you encounter issues with Firebase:

1. Check that all Firebase dependencies are installed:
   ```bash
   npm install firebase
   ```

2. Verify the Firebase configuration in `firebase.ts`

3. Check the browser console for any error messages

4. Ensure you have proper network connectivity