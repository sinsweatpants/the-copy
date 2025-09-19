import React, { useState } from 'react';
import { FileText, Zap, BarChart3, Cpu, Eye, Download, Copy } from 'lucide-react';

interface AnalysisResult {
  id: string;
  type: string;
  title: string;
  content: string;
  timestamp: Date;
  quality: number;
}

const TextAnalysisPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<'style' | 'completion' | 'context' | 'dramatic'>('style');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisTypes = [
    {
      id: 'style',
      title: 'تحليل الأسلوب',
      description: 'تحليل الأسلوب الداخلي ونمط الكتابة',
      icon: '✍️',
      functions: [
        '_analyze_internal_style',
        '_analyze_vocabulary_style', 
        '_analyze_syntactic_style',
        '_analyze_writing_tone',
        '_analyze_formality_level'
      ]
    },
    {
      id: 'completion',
      title: 'إكمال النصوص',
      description: 'إكمال النصوص الناقصة بذكاء تنبؤي',
      icon: '🔮',
      functions: [
        'complete_text',
        '_generate_completion',
        '_determine_completion_strategy',
        '_calculate_optimal_completion_length',
        '_assess_completion_quality'
      ]
    },
    {
      id: 'context',
      title: 'تحليل السياق',
      description: 'تحليل السياق العام والزماني والمكاني',
      icon: '🎯',
      functions: [
        '_analyze_context',
        '_analyze_temporal_spatial_context',
        '_extract_general_context',
        '_assess_context_completeness'
      ]
    },
    {
      id: 'dramatic',
      title: 'التحليل الدرامي',
      description: 'تحليل التدفق الدرامي والتوتر والإيقاع',
      icon: '🎭',
      functions: [
        '_analyze_dramatic_flow',
        '_analyze_dramatic_tension',
        '_analyze_emotional_progression',
        '_calculate_dramatic_momentum',
        '_analyze_rhythmic_patterns'
      ]
    }
  ];

  const sampleTexts = {
    drama: `يدخل أحمد إلى الغرفة ببطء، عيناه محمرتان من السهر.

أحمد: (بصوت متعب) لم أعد أستطيع تحمل هذا.

تنظر فاطمة إليه بقلق، تضع يدها على كتفه.

فاطمة: ما الذي يحدث يا أحمد؟ أنت تبدو منهكاً.

أحمد: (يجلس على الكرسي) المشروع... إنه يستنزف كل طاقتي.`,

    narrative: `كانت المدينة تغرق في صمت الفجر، والشوارع خالية إلا من أصداء خطوات متباعدة. وقف سامي أمام النافذة يتأمل الأفق، يفكر في القرار الذي سيغير مسار حياته. كان يعلم أن هذه اللحظة ستكون فاصلة.`,

    dialogue: `- هل تعتقد أننا سنجد الحل؟
- يجب أن نؤمن بذلك، وإلا فلن نصل إلى أي مكان.
- لكن الوقت يداهمنا، ولا أرى أي بادرة أمل.
- الأمل يصنعه الإنسان، لا ينتظره من السماء.`
  };

  const handleAnalysis = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // محاكاة استدعاء API للتحليل
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysisType = analysisTypes.find(t => t.id === selectedAnalysis);
      
      const newResult: AnalysisResult = {
        id: Date.now().toString(),
        type: selectedAnalysis,
        title: analysisType?.title || 'تحليل',
        content: generateMockAnalysis(selectedAnalysis, inputText),
        timestamp: new Date(),
        quality: Math.round(Math.random() * 20 + 80)
      };
      
      setAnalysisResults(prev => [newResult, ...prev]);
    } catch (error) {
      console.error('خطأ في التحليل:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockAnalysis = (type: string, text: string): string => {
    const wordCount = text.split(' ').length;
    
    switch (type) {
      case 'style':
        return `## تحليل الأسلوب الأدبي

### 📝 الخصائص اللغوية
- **عدد الكلمات**: ${wordCount}
- **مستوى الرسمية**: متوسط
- **النبرة العامة**: عاطفية ومؤثرة
- **التعقيد اللغوي**: مناسب للجمهور العام

### 🎨 السمات الأسلوبية
- استخدام وصفي غني بالتفاصيل
- توازن جيد بين الحوار والسرد
- إيقاع متدرج يبني التوتر

### 💡 التوصيات
- الحفاظ على هذا المستوى من التعبير
- إضافة المزيد من التفاصيل الحسية`;

      case 'completion':
        return `## اقتراح إكمال النص

### 🔮 التوقع المبني على السياق
بناءً على تحليل النمط والسياق، يمكن إكمال النص كالتالي:

"${text.substring(text.lastIndexOf('.') + 1) || text.substring(Math.max(0, text.length - 50))}..."

### ✨ الإكمال المقترح
[يواصل النص بنفس الأسلوب والإيقاع المحددين...]

### 📊 تقييم الجودة
- **التماسك**: 95%
- **الاتساق الأسلوبي**: 92%
- **الطبيعية**: 88%`;

      case 'context':
        return `## تحليل السياق والبيئة

### 🌍 السياق المكاني
- **المكان**: ${text.includes('غرفة') ? 'مكان داخلي (غرفة)' : 'مكان غير محدد'}
- **البيئة**: ${text.includes('صمت') ? 'هادئة ومتأملة' : 'عادية'}

### ⏰ السياق الزماني  
- **الوقت**: ${text.includes('فجر') ? 'الفجر' : text.includes('ليل') ? 'الليل' : 'غير محدد'}
- **المدة**: لحظة زمنية قصيرة

### 🎭 السياق الدرامي
- مشهد يركز على الحالة النفسية
- توتر عاطفي واضح`;

      case 'dramatic':
        return `## التحليل الدرامي المتعمق

### 📈 منحنى التوتر
- **نقطة البداية**: مستوى توتر منخفض
- **التصاعد**: تدريجي ومدروس  
- **الذروة**: ${text.includes('قرار') ? 'لحظة اتخاذ القرار' : 'غير واضحة'}

### 🎵 الإيقاع السردي
- **السرعة**: متوسطة إلى بطيئة
- **الكثافة العاطفية**: عالية
- **نقاط التحول**: ${Math.floor(wordCount / 30)} نقطة محورية

### 🎭 العناصر الدرامية
- صراع داخلي واضح
- بناء الشخصية من خلال الأفعال
- استخدام فعال للحوار الداخلي`;

      default:
        return 'تحليل عام للنص...';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResult = (result: AnalysisResult) => {
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تحليل-${result.type}-${result.timestamp.toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ✍️ تحليل وإكمال النصوص
          </h1>
          <p className="text-gray-300 text-lg">
            أدوات متقدمة لتحليل النصوص الأدبية وإكمالها بالذكاء الاصطناعي
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <h2 className="text-xl font-bold text-white mb-4">📝 النص للتحليل</h2>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="أدخل النص الذي تريد تحليله أو إكماله هنا..."
                className="w-full h-48 p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-400">
                  الكلمات: {inputText.split(' ').filter(w => w.length > 0).length} | 
                  الأحرف: {inputText.length}
                </div>
                
                <div className="flex gap-2">
                  <select
                    onChange={(e) => setInputText(sampleTexts[e.target.value as keyof typeof sampleTexts] || '')}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر نص تجريبي</option>
                    <option value="drama">مشهد درامي</option>
                    <option value="narrative">نص سردي</option>
                    <option value="dialogue">حوار</option>
                  </select>
                  
                  <button
                    onClick={handleAnalysis}
                    disabled={!inputText.trim() || isAnalyzing}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <Cpu className="w-4 h-4 inline mr-2 animate-spin" />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 inline mr-2" />
                        تحليل
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {analysisResults.map((result) => (
                <div key={result.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {analysisTypes.find(t => t.id === result.type)?.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{result.title}</h3>
                        <p className="text-sm text-gray-400">
                          {result.timestamp.toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <BarChart3 size={16} className="text-green-400" />
                        <span className="text-green-400 font-medium">{result.quality}%</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(result.content)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="نسخ"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => downloadResult(result)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="تحميل"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                      {result.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Types Panel */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <h2 className="text-xl font-bold text-white mb-4">🔧 أنواع التحليل</h2>
              
              <div className="space-y-3">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAnalysis(type.id as any)}
                    className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                      selectedAnalysis === type.id
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm mb-1">{type.title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">{type.description}</p>
                        <div className="mt-2 text-xs text-blue-400">
                          {type.functions.length} دالة متاحة
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
              <h3 className="text-lg font-bold text-white mb-4">📊 إحصائيات سريعة</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">التحليلات المكتملة</span>
                  <span className="text-white font-bold">{analysisResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">متوسط الجودة</span>
                  <span className="text-green-400 font-bold">
                    {analysisResults.length > 0 
                      ? Math.round(analysisResults.reduce((acc, r) => acc + r.quality, 0) / analysisResults.length)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الدوال المتاحة</span>
                  <span className="text-blue-400 font-bold">
                    {analysisTypes.reduce((acc, t) => acc + t.functions.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnalysisPage;