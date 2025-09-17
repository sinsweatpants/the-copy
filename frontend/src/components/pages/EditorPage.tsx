import React, { useState } from 'react';
import ScreenplayEditor from '../screenplay-editor';
import { Upload, Download, Code, Palette, Bug, Zap, Search, Settings, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const EditorPage: React.FC = () => {
  const [activeHelperSection, setActiveHelperSection] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([
    '✓ محرر السيناريو جاهز للاستخدام',
    '⚠ تحذير: تم تحميل النص بنجاح',
    '✓ حفظ تلقائي مفعل'
  ]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setDebugLogs(prev => [...prev, `✓ تم رفع ${files.length} ملف`]);
  };

  const formatCode = (type: 'json' | 'css') => {
    setDebugLogs(prev => [...prev, `✓ تم تنسيق ${type.toUpperCase()}`]);
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
              محرر السيناريو المتطور
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              بيئة تحرير متكاملة مع أدوات مساعدة ذكية
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* منطقة المحرر */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <ScreenplayEditor />
            </div>
          </div>

          {/* الأدوات المساعدة */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                الأدوات المساعدة
              </h2>
              <p className="text-gray-400 text-sm">أدوات متقدمة لتحسين تجربة التحرير</p>
            </div>

            {/* أدوات معالجة الملفات */}
            <HelperSection id="files" title="معالجة الملفات" icon={FileText}>
              <div className="space-y-4">
                {/* رفع الملفات */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">رفع الملفات</label>
                  <div className="border-2 border-dashed border-purple-400/30 rounded-lg p-4 text-center hover:border-purple-400/50 transition-colors">
                    <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 mb-2">اسحب الملفات هنا أو انقر للتحديد</p>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="cursor-pointer text-purple-400 hover:text-purple-300 text-xs"
                    >
                      اختر الملفات
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.slice(-3).map((file, index) => (
                        <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* تنسيق سريع */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">تنسيق سريع</label>
                  <div className="space-y-2">
                    <button 
                      onClick={() => formatCode('json')}
                      className="w-full bg-blue-500/20 text-blue-300 px-3 py-2 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      تنسيق JSON
                    </button>
                    <button 
                      onClick={() => formatCode('css')}
                      className="w-full bg-green-500/20 text-green-300 px-3 py-2 rounded text-sm hover:bg-green-500/30 transition-colors"
                    >
                      تنسيق CSS
                    </button>
                  </div>
                </div>
              </div>
            </HelperSection>

            {/* أدوات الواجهة */}
            <HelperSection id="ui" title="مكونات الواجهة" icon={Palette}>
              <div className="space-y-4">
                {/* لوحة الألوان */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">لوحة الألوان</label>
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

                {/* إعدادات الخط */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">إعدادات الخط</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="Amiri">أميري</option>
                    <option value="Cairo">القاهرة</option>
                    <option value="Scheherazade">شهرزاد</option>
                  </select>
                </div>
              </div>
            </HelperSection>

            {/* أدوات التطوير */}
            <HelperSection id="dev" title="أدوات التطوير" icon={Settings}>
              <div className="space-y-4">
                {/* بحث سريع */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">بحث سريع</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="البحث في النص..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* وحدة التحكم */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">وحدة التحكم</label>
                  <div className="bg-black/30 rounded-lg p-3 h-24 overflow-y-auto text-xs font-mono space-y-1">
                    {debugLogs.slice(-4).map((log, index) => (
                      <div key={index} className="text-green-400">{log}</div>
                    ))}
                  </div>
                </div>

                {/* مراقب الأداء */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">مراقب الأداء</label>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">الذاكرة:</span>
                      <span className="text-white font-medium">42.1 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">وقت التحميل:</span>
                      <span className="text-white font-medium">1.2s</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '78%' }}></div>
                    </div>
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

export default EditorPage;