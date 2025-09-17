import React, { useState } from 'react';
import { FileText, Download, Copy, Eye, EyeOff } from 'lucide-react';

interface ResultsDisplayProps {
  results: any;
  analysisType: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, analysisType }) => {
  const content = results?.content || results || '';

  const renderContent = () => {
    if (!content) return <p className="text-gray-400">لا توجد نتائج لعرضها</p>;
    
    return (
      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-xl border border-gray-600 mb-6">
      <div className="p-4 border-b border-gray-600">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">نتائج التحليل</h2>
          <div className="text-sm text-gray-400">
            نوع التحليل: {analysisType}
          </div>
        </div>
      </div>

      <div className="p-6">
        {renderContent()}
      </div>

      <div className="px-6 py-4 border-t border-gray-600 bg-gray-900/30">
        <div className="flex justify-between text-sm text-gray-400">
          <span>عدد الكلمات: {content ? content.split(' ').length : 0}</span>
          <span>تم الإنشاء: {new Date().toLocaleDateString('ar-SA')}</span>
        </div>
      </div>
    </div>
  );
};