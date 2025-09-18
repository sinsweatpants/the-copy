import { app } from '../lib/firebase';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL 
} from 'firebase/storage';

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const signInAnonymouslyUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

export const onUserStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (filePath: string, content: string) => {
  try {
    const storageRef = ref(storage, filePath);
    await uploadString(storageRef, content, 'raw');
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export default {
  app,
  auth,
  db,
  storage,
  signInAnonymouslyUser,
  onUserStateChanged,
  addDocument,
  getDocuments,
  uploadFile
};