import React from 'react';

interface Props {
  auditing: boolean;
  rulerVisible: boolean;
  onToggleGemini: () => void;
  onToggleRuler: () => void;
}

const EditorToolbar: React.FC<Props> = ({ auditing, rulerVisible, onToggleGemini, onToggleRuler }) => (
  <div className="flex gap-2 mb-2 text-sm">
    <button type="button" className="px-2 border">B</button>
    <button type="button" className="px-2 border">I</button>
    <button type="button" className="px-2 border">U</button>
    <button type="button" className="px-2 border" onClick={onToggleRuler}>
      {rulerVisible ? 'إخفاء المسطرة' : 'إظهار المسطرة'}
    </button>
    <button type="button" className="px-2 border" onClick={onToggleGemini}>
      {auditing ? 'إيقاف Gemini' : 'تشغيل Gemini'}
    </button>
  </div>
);

export default EditorToolbar;
