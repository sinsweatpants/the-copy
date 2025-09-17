import React, { useState } from 'react';
import ScreenplayEditor from './components/screenplay-editor';
import './styles/tailwind.css';

function App() {
  const [showEditor, setShowEditor] = useState(false);
  return (
    <div className="App" role="main">
      {showEditor ? (
        <ScreenplayEditor />
      ) : (
        <div className="p-4" dir="rtl">
          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            افتح محرر السيناريو
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
