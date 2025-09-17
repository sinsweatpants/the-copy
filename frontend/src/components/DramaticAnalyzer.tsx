import React, { useState } from 'react';
import { FileUpload } from './analyzer/FileUpload';
import { AnalysisSelector } from './analyzer/AnalysisSelector';
import { ExpertChat } from './analyzer/ExpertChat2';
import { SwarmDialogue } from './analyzer/SwarmDialogue';
import { ResultsDisplay } from './analyzer/ResultsDisplay';
import { Sparkles, MessageCircle, Users } from 'lucide-react';

type AnalysisMode = 'individual' | 'chat' | 'swarm';
type AnalysisType = 
  | 'comprehensive' 
  | 'commercial' 
  | 'writer_voice' 
  | 'character_analysis' 
  | 'quantitative'
  | 'creative'
  | 'completion'
  | 'integrated';

interface ProcessedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

const DramaticAnalyzer: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('individual');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('comprehensive');
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analysisModes = [
    {
      id: 'individual' as AnalysisMode,
      title: 'التحليل الفردي',
      description: 'تحليل تقليدي بخبير واحد متخصص',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'chat' as AnalysisMode,
      title: 'المحادثة التفاعلية',
      description: 'حوار مباشر مع خبراء متخصصين',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'swarm' as AnalysisMode,
      title: 'حوار السرب',
      description: 'حوار جماعي بين عدة خبراء للحصول على تحليل شامل',
      icon: Users,
      color: 'from-green-500 to-teal-600'
    }
  ];

  const handleFilesUploaded = (files: ProcessedFile[]) => {
    setUploadedFiles(files);
    setError(null);
  };

  const handleStartAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      setError('يرجى رفع ملف واحد على الأقل للتحليل');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // هنا سيتم استدعاء API الخاص بالتحليل
      const response = await fetch('/api/dramatic-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: uploadedFiles,
          analysisType: selectedAnalysis,
          mode: analysisMode
        })
      });

      if (!response.ok) {
        throw new Error('فشل في التحليل');
      }

      const results = await response.json();
      setAnalysisResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحليل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            المحلل الدرامي والمبدع المحاكي
          </h1>
          <p className="text-gray-300 text-lg">
            أداة تحليل وسرد متقدمة تعمل بذكاء اصطناعي متطور
          </p>
        </div>

        {/* Analysis Mode Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">اختر نمط التحليل</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {analysisModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = analysisMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setAnalysisMode(mode.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${mode.color} mb-4`}>
                      <Icon size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                    <p className="text-gray-300 text-sm">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto">
          {/* File Upload */}
          <FileUpload
            uploadedFiles={uploadedFiles}
            onFilesUploaded={handleFilesUploaded}
            disabled={isLoading}
          />

          {/* Analysis Type Selection for Individual Mode */}
          {analysisMode === 'individual' && (
            <AnalysisSelector
              selectedAnalysis={selectedAnalysis}
              onAnalysisSelect={setSelectedAnalysis}
              disabled={isLoading}
            />
          )}

          {/* Action Button */}
          {uploadedFiles.length > 0 && (
            <div className="text-center my-8">
              <button
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'جاري التحليل...' : 'ابدأ التحليل'}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Analysis Interface Based on Mode */}
          {analysisMode === 'chat' && uploadedFiles.length > 0 && (
            <ExpertChat
              files={uploadedFiles}
              isLoading={isLoading}
            />
          )}

          {analysisMode === 'swarm' && uploadedFiles.length > 0 && (
            <SwarmDialogue
              files={uploadedFiles}
              isLoading={isLoading}
            />
          )}

          {/* Results Display */}
          {analysisResults && (
            <ResultsDisplay
              results={analysisResults}
              analysisType={selectedAnalysis}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DramaticAnalyzer;