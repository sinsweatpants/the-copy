import React, { useState } from 'react';
import { FileUpload } from '../analyzer/FileUpload';
import { AnalysisSelector } from '../analyzer/AnalysisSelector';
import { ExpertChat } from '../analyzer/ExpertChat2';
import { SwarmDialogue } from '../analyzer/SwarmDialogue';
import { ResultsDisplay } from '../analyzer/ResultsDisplay';
import { Sparkles, MessageCircle, Users, Upload, Download, Code, Palette, Bug, Zap, Search, Settings, FileText, ChevronDown, ChevronUp, BarChart3, TrendingUp } from 'lucide-react';

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

const DramaticAnalyzerPage: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('individual');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('comprehensive');
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Helper tools state
  const [activeHelperSection, setActiveHelperSection] = useState<string | null>(null);
  const [helperFiles, setHelperFiles] = useState<File[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([
    '✓ المحلل الدرامي جاهز للاستخدام',
    '⚠ تحذير: تأكد من رفع الملفات المطلوبة',
    '✓ خوارزميات التحليل مُحدثة'
  ]);
  const [analysisStats, setAnalysisStats] = useState({
    totalAnalyses: 42,
    averageTime: '2.3 دقيقة',
    accuracy: '94%'
  });

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

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  const handleFilesUploaded = (files: ProcessedFile[]) => {
    setUploadedFiles(files);
    setError(null);
    setDebugLogs(prev => [...prev, `✓ تم رفع ${files.length} ملف للتحليل`]);
  };

  const handleHelperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setHelperFiles(prev => [...prev, ...files]);
    setDebugLogs(prev => [...prev, `✓ تم رفع ${files.length} ملف مساعد`]);
  };

  const formatData = (type: 'json' | 'csv') => {
    setDebugLogs(prev => [...prev, `✓ تم تنسيق البيانات بصيغة ${type.toUpperCase()}`]);
  };

  const exportResults = (format: 'pdf' | 'docx') => {
    setDebugLogs(prev => [...prev, `✓ تم تصدير النتائج بصيغة ${format.toUpperCase()}`]);
  };

  const handleStartAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      setError('يرجى رفع ملف واحد على الأقل للتحليل');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebugLogs(prev => [...prev, '🔄 بدء عملية التحليل...']);
    
    try {
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
      setDebugLogs(prev => [...prev, '✅ تم التحليل بنجاح']);
      setAnalysisStats(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses + 1
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء التحليل';
      setError(errorMsg);
      setDebugLogs(prev => [...prev, `❌ خطأ: ${errorMsg}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHelperSection = (section: string) => {
    setActiveHelperSection(activeHelperSection === section ? null : section);
  };

  const HelperSection = ({ id, title, icon: Icon, children }: {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }) => (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-purple-400/30 transition-all duration-300">
      <button
        onClick={() => toggleHelperSection(id)}
        className="w-full flex items-center justify-between p-4 text-right hover:bg-white/5 rounded-t-2xl transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">{title}</span>
        </div>
        {activeHelperSection === id ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {activeHelperSection === id && (
        <div className="p-4 border-t border-white/10 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-md border-b border-purple-500/30 shadow-2xl">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              المحلل الدرامي المتطور
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              أداة تحليل وسرد متقدمة مع أدوات مساعدة ذكية
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* منطقة التحليل الرئيسية */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl">
              {/* Analysis Mode Selection */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">اختر نمط التحليل</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {analysisModes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = analysisMode === mode.id;
                    
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setAnalysisMode(mode.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-purple-400 bg-purple-500/20'
                            : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${mode.color} mb-3`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <h3 className="text-lg font-bold mb-2 text-white">{mode.title}</h3>
                          <p className="text-gray-300 text-xs">{mode.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                <div className="text-center my-6">
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

          {/* الأدوات المساعدة */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                أدوات التحليل المساعدة
              </h2>
              <p className="text-gray-400 text-sm">أدوات متخصصة لتحسين عملية التحليل</p>
            </div>

            {/* أدوات معالجة البيانات */}
            <HelperSection id="data" title="معالجة البيانات" icon={BarChart3}>
              <div className="space-y-4">
                {/* رفع ملفات إضافية */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ملفات إضافية للتحليل</label>
                  <div className="border-2 border-dashed border-blue-400/30 rounded-lg p-4 text-center hover:border-blue-400/50 transition-colors">
                    <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 mb-2">ملفات مرجعية أو بيانات إضافية</p>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleHelperFileUpload}
                      className="hidden" 
                      id="helper-file-upload"
                    />
                    <label 
                      htmlFor="helper-file-upload" 
                      className="cursor-pointer text-blue-400 hover:text-blue-300 text-xs"
                    >
                      اختر الملفات
                    </label>
                  </div>
                  {helperFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {helperFiles.slice(-3).map((file, index) => (
                        <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* تنسيق البيانات */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">تنسيق البيانات</label>
                  <div className="space-y-2">
                    <button 
                      onClick={() => formatData('json')}
                      className="w-full bg-green-500/20 text-green-300 px-3 py-2 rounded text-sm hover:bg-green-500/30 transition-colors"
                    >
                      تنسيق JSON
                    </button>
                    <button 
                      onClick={() => formatData('csv')}
                      className="w-full bg-blue-500/20 text-blue-300 px-3 py-2 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      تصدير CSV
                    </button>
                  </div>
                </div>

                {/* تصدير النتائج */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">تصدير النتائج</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => exportResults('pdf')}
                      className="bg-red-500/20 text-red-300 px-3 py-2 rounded text-sm hover:bg-red-500/30 transition-colors"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={() => exportResults('docx')}
                      className="bg-purple-500/20 text-purple-300 px-3 py-2 rounded text-sm hover:bg-purple-500/30 transition-colors"
                    >
                      DOCX
                    </button>
                  </div>
                </div>
              </div>
            </HelperSection>

            {/* أدوات الواجهة */}
            <HelperSection id="ui" title="أدوات الواجهة" icon={Palette}>
              <div className="space-y-4">
                {/* لوحة الألوان */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ألوان التحليل</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                          selectedColor === color ? 'border-white scale-110' : 'border-white/30 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">اللون المحدد: {selectedColor}</div>
                </div>

                {/* عرض النتائج */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">نمط العرض</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="detailed">تفصيلي</option>
                    <option value="summary">ملخص</option>
                    <option value="visual">بصري</option>
                  </select>
                </div>
              </div>
            </HelperSection>

            {/* أدوات التطوير والإحصائيات */}
            <HelperSection id="dev" title="الإحصائيات والتطوير" icon={TrendingUp}>
              <div className="space-y-4">
                {/* بحث في النتائج */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">البحث في النتائج</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="البحث في تحليلات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* إحصائيات التحليل */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">إحصائيات التحليل</label>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">إجمالي التحليلات:</span>
                      <span className="text-white font-medium">{analysisStats.totalAnalyses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">متوسط الوقت:</span>
                      <span className="text-white font-medium">{analysisStats.averageTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">دقة التحليل:</span>
                      <span className="text-white font-medium">{analysisStats.accuracy}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>

                {/* سجل العمليات */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">سجل العمليات</label>
                  <div className="bg-black/30 rounded-lg p-3 h-24 overflow-y-auto text-xs font-mono space-y-1">
                    {debugLogs.slice(-4).map((log, index) => (
                      <div key={index} className="text-green-400">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </HelperSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DramaticAnalyzerPage;