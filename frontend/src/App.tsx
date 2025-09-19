import React, { useState } from 'react';
import EditorPage from './pages/EditorPage';
import DramaticAnalyzerPage from './pages/DramaticAnalyzerPage';
import Navigation from './components/layout/Navigation';
import AiAgentsPage from './pages/AiAgentsPage';
import TextAnalysisPage from './pages/TextAnalysisPage';
import './styles/tailwind.css';
import './styles/animations.css';

type CurrentPage = 'home' | 'editor' | 'analyzer' | 'ai-agents' | 'text-analysis' | 'firebase-test';

function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'editor':
        return <EditorPage />;
      case 'analyzer':
        return <DramaticAnalyzerPage />;
      case 'ai-agents':
        return <AiAgentsPage />;
      case 'text-analysis':
        return <TextAnalysisPage />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden" dir="rtl">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>
            
            <div className="container mx-auto px-4 py-16 relative z-10">
              <div className="text-center mb-16">
                <div className="mb-8">
                  <div className="flex flex-col items-center justify-center" dir="rtl">
                    <div className="flex items-center justify-center space-x-10 mb-6" dir="rtl">
                      <div className="flex flex-col items-center">
                        <h1 
                          className="text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse"
                          dir="rtl"
                        >
                          النسخة -
                        </h1>
                        <p className="text-xl text-gray-300 font-medium mt-4 text-center">
                          بس اصلي
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <h1 
                          className="text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse"
                          dir="ltr"
                        >
                          the copy
                        </h1>
                        <p className="text-xl text-gray-300 font-medium mt-4 text-center">
                          Because Originals Know What to Copy.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-10"></div>
                </div>
                <p className="text-2xl text-gray-300 mb-8 font-light leading-relaxed max-w-4xl mx-auto">
                  <br />
                  <span className="text-lg text-purple-300"></span>
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
                  <div className="text-center">
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">✍️</div>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      محرر السيناريو
                    </h2>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      محرر متقدم مع تصحيح تلقائي وتحليل ذكي للنصوص العربية
                    </p>
                    <button
                      onClick={() => setCurrentPage('editor')}
                      className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-purple-500/50 transform hover:-translate-y-1"
                    >
                      <span className="flex items-center justify-center gap-2">
                        ابدأ الكتابة
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
                  <div className="text-center">
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎭</div>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      المحلل الدرامي
                    </h2>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      تحليل معمق للنصوص الدرامية بالذكاء الاصطناعي المتطور
                    </p>
                    <button
                      onClick={() => setCurrentPage('analyzer')}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1"
                    >
                      <span className="flex items-center justify-center gap-2">
                        ابدأ التحليل
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-indigo-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25">
                  <div className="text-center">
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      محركات الذكاء الاصطناعي
                    </h2>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      إدارة الوكلاء والأسراب الذكية لمعالجة المحتوى
                    </p>
                    <button
                      onClick={() => setCurrentPage('ai-agents')}
                      className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1"
                    >
                      <span className="flex items-center justify-center gap-2">
                        إدارة الوكلاء
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25">
                  <div className="text-center">
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📝</div>
                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      تحليل النصوص
                    </h2>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      تحليل وإكمال النصوص بتقنيات الذكاء الاصطناعي المتقدمة
                    </p>
                    <button
                      onClick={() => setCurrentPage('text-analysis')}
                      className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:-translate-y-1"
                    >
                      <span className="flex items-center justify-center gap-2">
                        تحليل النصوص
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* شرح الأدوات المساعدة */}
              <div className="max-w-5xl mx-auto">
                <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all duration-500">
                  <h3 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    الأدوات المساعدة
                  </h3>
                  <p className="text-gray-300 text-center mb-8 text-xl leading-relaxed">
                    مجموعة من الأدوات المساعدة المتطورة متاحة في جميع الصفحات لتعزيز تجربة العمل
                  </p>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center group hover:scale-105 transition-transform duration-300">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📁</div>
                      <h4 className="font-bold mb-3 text-xl text-blue-300">معالجة الملفات</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">رفع وتحويل الملفات بصيغ متعددة مع معالجة ذكية للمحتوى</p>
                    </div>
                    <div className="text-center group hover:scale-105 transition-transform duration-300">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎨</div>
                      <h4 className="font-bold mb-3 text-xl text-purple-300">مكونات الواجهة</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">لوحة الألوان والعناصر التفاعلية لتخصيص تجربة المستخدم</p>
                    </div>
                    <div className="text-center group hover:scale-105 transition-transform duration-300">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🛠️</div>
                      <h4 className="font-bold mb-3 text-xl text-green-300">أدوات التطوير</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">تتبع الأخطاء ومراقبة الأداء مع أدوات البحث المتقدمة</p>
                    </div>
                  </div>
                  <div className="text-center mt-10">
                    <p className="px-10 py-4 text-gray-300 rounded-2xl font-medium text-lg">
                      <span className="flex items-center justify-center gap-3">
                        ✨ الأدوات متاحة داخل كل صفحة
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App" role="main">
      {currentPage !== 'home' && (
        <Navigation 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
        />
      )}
      
      {renderPage()}
    </div>
  );
}

export default App;