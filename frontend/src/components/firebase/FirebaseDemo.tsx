import React, { useState, useEffect } from 'react';
import firebaseService from '../../services/firebaseService';

const FirebaseDemo: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newDocument, setNewDocument] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = firebaseService.onUserStateChanged(setUser);
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await firebaseService.signInAnonymouslyUser();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.trim()) return;
    
    try {
      setLoading(true);
      await firebaseService.addDocument('test-collection', {
        content: newDocument,
        createdAt: new Date()
      });
      setNewDocument('');
      // Refresh documents list
      await loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await firebaseService.getDocuments('test-collection');
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Firebase Demo</h2>
      
      {/* Auth Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Authentication</h3>
        {user ? (
          <div className="p-4 bg-green-100 rounded-lg">
            <p className="text-green-800">_authenticated as: {user.uid}</p>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in Anonymously'}
          </button>
        )}
      </div>

      {/* Firestore Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Firestore</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newDocument}
            onChange={(e) => setNewDocument(e.target.value)}
            placeholder="Enter document content"
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            disabled={loading || !user}
          />
          <button
            onClick={handleAddDocument}
            disabled={loading || !user || !newDocument.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        
        <div className="mb-4">
          <button
            onClick={loadDocuments}
            disabled={loading || !user}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Documents'}
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">{doc.content}</p>
                  <p className="text-sm text-gray-500">{new Date(doc.createdAt?.seconds * 1000).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No documents found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebaseDemo;