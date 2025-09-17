import React, { useState } from 'react';

interface ProcessedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface SwarmDialogueProps {
  files: ProcessedFile[];
  isLoading: boolean;
}

export const SwarmDialogue: React.FC<SwarmDialogueProps> = ({ files, isLoading }) => {
  const [dialogue, setDialogue] = useState<Array<{expert: string, content: string}>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const startDialogue = () => {
    setIsRunning(true);
    setDialogue([]);
    
    // محاكاة حوار السرب
    const experts = ['المحلل الدرامي', 'خبير الشخصيات', 'محلل السوق'];
    let index = 0;
    
    const addMessage = () => {
      if (index < experts.length) {
        setTimeout(() => {
          setDialogue(prev => [...prev, {
            expert: experts[index],
            content: `تحليل من ${experts[index]} للملفات: ${files.map(f => f.name).join(', ')}`
          }]);
          index++;
          addMessage();
        }, 1500);
      } else {
        setIsRunning(false);
      }
    };
    
    addMessage();
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-xl border border-gray-600 mb-6">
      <div className="p-4 border-b border-gray-600">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">حوار السرب التفاعلي</h3>
          <button
            onClick={startDialogue}
            disabled={files.length === 0 || isRunning}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            {isRunning ? 'جاري الحوار...' : 'ابدأ الحوار'}
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto p-4">
        {dialogue.map((entry, index) => (
          <div key={index} className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <h4 className="font-bold text-purple-300 mb-2">{entry.expert}</h4>
            <p className="text-gray-200">{entry.content}</p>
          </div>
        ))}
        
        {dialogue.length === 0 && !isRunning && (
          <p className="text-gray-400 text-center py-8">اضغط "ابدأ الحوار" لبدء المناقشة</p>
        )}
      </div>
    </div>
  );
};
