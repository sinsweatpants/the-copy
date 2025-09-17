import React from 'react';

type AnalysisType = 'comprehensive' | 'commercial' | 'character_analysis';

interface AnalysisSelectorProps {
  selectedAnalysis: AnalysisType;
  onAnalysisSelect: (type: AnalysisType) => void;
  disabled?: boolean;
}

export const AnalysisSelector: React.FC<AnalysisSelectorProps> = ({
  selectedAnalysis,
  onAnalysisSelect,
  disabled = false
}) => {
  const analysisTypes = [
    { id: 'comprehensive' as AnalysisType, title: 'التحليل الشامل' },
    { id: 'commercial' as AnalysisType, title: 'الجدوى التجارية' },
    { id: 'character_analysis' as AnalysisType, title: 'تحليل الشخصيات' },
  ];

  return (
    <div className="w-full p-6 bg-gray-800/50 rounded-xl border border-gray-600 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">اختر نوع التحليل</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        {analysisTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onAnalysisSelect(type.id)}
            disabled={disabled}
            className={`p-4 rounded-lg border transition-colors ${
              selectedAnalysis === type.id
                ? 'border-purple-400 bg-purple-500/20'
                : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'
            }`}
          >
            <h3 className="text-white font-medium">{type.title}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};