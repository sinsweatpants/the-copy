import React, { useEffect, useState } from 'react';
import { app, analytics } from '../lib/firebase';
import FirebaseDemo from './FirebaseDemo';

const FirebaseTest: React.FC = () => {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [analyticsAvailable, setAnalyticsAvailable] = useState(false);

  useEffect(() => {
    if (app) {
      setIsFirebaseInitialized(true);
      console.log('Firebase App initialized:', app.options.projectId);
    }

    if (analytics) {
      setAnalyticsAvailable(true);
      console.log('Firebase Analytics initialized');
    }
  }, []);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Firebase Initialization Test</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-700 rounded">
          <h3 className="font-semibold text-white mb-2">Initialization Status</h3>
          <p className="text-green-400">Firebase App: {isFirebaseInitialized ? '✅ Initialized' : '❌ Not initialized'}</p>
          <p className="text-green-400">Analytics: {analyticsAvailable ? '✅ Available' : '❌ Not available'}</p>
        </div>
        <div className="p-4 bg-gray-700 rounded">
          <h3 className="font-semibold text-white mb-2">Project Info</h3>
          <p className="text-gray-300">Project ID: {app?.options?.projectId || 'N/A'}</p>
          <p className="text-gray-300">App ID: {app?.options?.appId || 'N/A'}</p>
        </div>
      </div>
      
      {/* Firebase Demo Component */}
      <div className="mt-6">
        <FirebaseDemo />
      </div>
    </div>
  );
};

export default FirebaseTest;