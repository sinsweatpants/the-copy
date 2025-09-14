import React from 'react';
import ScreenplayEditor from './components/editor/Editor';
import './styles/tailwind.css'; // تأكد من وجود ملف الأنماط هذا

function App() {
  return (
    <div className="App" role="main">
      <ScreenplayEditor />
    </div>
  );
}

export default App;
