import React, { useState } from 'react';

interface ProcessedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

interface ExpertChatProps {
  files: ProcessedFile[];
  isLoading: boolean;
}

export const ExpertChat: React.FC<ExpertChatProps> = ({ files, isLoading }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'شكراً لك. سأحلل الملفات المرفوعة.'
      }]);
    }, 1000);
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-xl border border-gray-600 mb-6">
      <div className="p-4 border-b border-gray-600">
        <h3 className="text-lg font-bold text-white">المحادثة مع الخبير</h3>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-purple-600 text-white ml-8' : 'bg-gray-700 text-gray-100 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="اكتب رسالتك..."
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
};