import React, { useState, useEffect } from 'react';
import { Bot, Users, Settings, Play, Pause, BarChart3, MessageSquare, Cpu, Upload, Download, Code, Palette, Bug, Zap, Search, FileText, ChevronDown, ChevronUp, Network, Brain, Cog } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'busy';
  specialization: string;
  avatar: string;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  };
}

const AiAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'ai_commander_aldawy',
      name: 'قائد الذكاء الاصطناعي (الضوي)',
      description: 'السلطة العليا ومنسق سرب العملاء',
      status: 'active',
      specialization: 'القيادة والتنسيق',
      avatar: '🎯',
      metrics: { tasksCompleted: 150, successRate: 98, avgResponseTime: 2.3 }
    },
    {
      id: 'market_analyst_sahar',
      name: 'محلل السوق (سحر)',
      description: 'تجري أبحاث السوق وتحليل المنافسين والجمهور',
      status: 'idle',
      specialization: 'تحليل السوق',
      avatar: '📊',
      metrics: { tasksCompleted: 89, successRate: 94, avgResponseTime: 4.1 }
    },
    {
      id: 'writer_voice_analyst',
      name: 'محلل بصمة الكاتب',
      description: 'يحلل الأسلوب الفريد للكاتب',
      status: 'busy',
      specialization: 'تحليل الأسلوب',
      avatar: '✍️',
      metrics: { tasksCompleted: 67, successRate: 96, avgResponseTime: 3.8 }
    },
    {
      id: 'character_analyst',
      name: 'محلل الشخصيات',
      description: 'يقدم تحليلاً نفسياً ودرامياً للشخصيات',
      status: 'active',
      specialization: 'تحليل الشخصيات',
      avatar: '👥',
      metrics: { tasksCompleted: 112, successRate: 97, avgResponseTime: 5.2 }
    }
  ]);

  const [swarms, setSwarms] = useState([
    {
      id: 'product_dialogue',
      name: 'حوار فريق المنتج',
      agents: ['market_analyst_sahar', 'writer_voice_analyst', 'ai_commander_aldawy'],
      status: 'running',
      tasksInProgress: 3
    },
    {
      id: 'creative_team',
      name: 'الفريق الإبداعي',
      agents: ['character_analyst', 'writer_voice_analyst'],
      status: 'idle',
      tasksInProgress: 0
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'agents' | 'swarms' | 'analytics'>('agents');
  
  // Helper tools state
  const [activeHelperSection, setActiveHelperSection] = useState<string | null>(null);
  const [configFiles, setConfigFiles] = useState<File[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('#6366F1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([
    '✓ شبكة الوكلاء متصلة ونشطة',
    '⚠ تحذير: تحديث نماذج التعلم الآلي',
    '✓ جميع الخدمات تعمل بكفاءة'
  ]);

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  const handleConfigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setConfigFiles(prev => [...prev, ...files]);
    setDebugLogs(prev => [...prev, `✓ تم رفع ${files.length} ملف إعدادات`]);
  };

  const deployAgent = (type: 'new' | 'update') => {
    setDebugLogs(prev => [...prev, `🚀 تم نشر وكيل ${type === 'new' ? 'جديد' : 'محدث'}`]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'idle': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play size={16} />;
      case 'busy': return <Cpu size={16} className="animate-spin" />;
      case 'idle': return <Pause size={16} />;
      default: return <Pause size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-md border-b border-purple-500/30 shadow-2xl">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              🤖 محركات الذكاء الاصطناعي
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              إدارة ومراقبة شبكة الوكلاء الذكيين مع أدوات تحكم متقدمة
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* منطقة إدارة الوكلاء الرئيسية */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl">
              {/* Navigation Tabs */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-600">
                  <div className="flex gap-2">
                    {[
                      { id: 'agents', label: 'الوكلاء', icon: Bot },
                      { id: 'swarms', label: 'فرق العمل', icon: Users },
                      { id: 'analytics', label: 'التحليلات', icon: BarChart3 }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedTab(tab.id as any)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            selectedTab === tab.id
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <Icon size={20} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Content based on selected tab */}
              {selectedTab === 'agents' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map((agent) => (
                      <div key={agent.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{agent.avatar}</div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                              <p className="text-purple-400 text-sm">{agent.specialization}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agent.status)}`}>
                            {getStatusIcon(agent.status)}
                            {agent.status === 'active' ? 'نشط' : agent.status === 'busy' ? 'مشغول' : 'خامل'}
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4">{agent.description}</p>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{agent.metrics.tasksCompleted}</div>
                            <div className="text-xs text-gray-400">المهام المكتملة</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{agent.metrics.successRate}%</div>
                            <div className="text-xs text-gray-400">معدل النجاح</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{agent.metrics.avgResponseTime}s</div>
                            <div className="text-xs text-gray-400">متوسط الاستجابة</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                            <MessageSquare size={16} className="inline ml-2" />
                            محادثة
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                            <Settings size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'swarms' && (
                <div className="space-y-6">
                  {swarms.map((swarm) => (
                    <div key={swarm.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{swarm.name}</h3>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              swarm.status === 'running' ? 'text-green-400 bg-green-500/20' : 'text-gray-400 bg-gray-500/20'
                            }`}>
                              {swarm.status === 'running' ? '🔄 يعمل' : '⏸️ متوقف'}
                            </div>
                            <span className="text-gray-400 text-sm">
                              {swarm.tasksInProgress} مهمة قيد التنفيذ
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                            تشغيل حوار سرب
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                            إعدادات
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {swarm.agents.map((agentId) => {
                          const agent = agents.find(a => a.id === agentId);
                          return agent ? (
                            <div key={agentId} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                              <span className="text-lg">{agent.avatar}</span>
                              <span className="text-sm text-gray-300">{agent.name}</span>
                              <div className={`w-2 h-2 rounded-full ${
                                agent.status === 'active' ? 'bg-green-400' : 
                                agent.status === 'busy' ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}></div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-bold text-white mb-4">📈 إحصائيات عامة</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">إجمالي الوكلاء</span>
                        <span className="text-white font-bold">{agents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">الوكلاء النشطة</span>
                        <span className="text-green-400 font-bold">
                          {agents.filter(a => a.status === 'active').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">معدل النجاح العام</span>
                        <span className="text-blue-400 font-bold">
                          {Math.round(agents.reduce((acc, a) => acc + a.metrics.successRate, 0) / agents.length)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-bold text-white mb-4">⚡ الأداء</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">إجمالي المهام</span>
                        <span className="text-white font-bold">
                          {agents.reduce((acc, a) => acc + a.metrics.tasksCompleted, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">متوسط وقت الاستجابة</span>
                        <span className="text-yellow-400 font-bold">
                          {(agents.reduce((acc, a) => acc + a.metrics.avgResponseTime, 0) / agents.length).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-lg font-bold text-white mb-4">🔄 فرق العمل</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">إجمالي الفرق</span>
                        <span className="text-white font-bold">{swarms.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">الفرق النشطة</span>
                        <span className="text-green-400 font-bold">
                          {swarms.filter(s => s.status === 'running').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">المهام الجارية</span>
                        <span className="text-blue-400 font-bold">
                          {swarms.reduce((acc, s) => acc + s.tasksInProgress, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الأدوات المساعدة */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                أدوات إدارة الوكلاء
              </h2>
              <p className="text-gray-400 text-sm">أدوات متخصصة لإدارة وتطوير الشبكة</p>
            </div>

            {/* أدوات إعداد الوكلاء */}
            <HelperSection id="config" title="إعدادات الوكلاء" icon={Cog}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ملفات الإعدادات</label>
                  <div className="border-2 border-dashed border-indigo-400/30 rounded-lg p-4 text-center hover:border-indigo-400/50 transition-colors">
                    <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 mb-2">JSON, YAML, أو XML</p>
                    <input 
                      type="file" 
                      multiple 
                      accept=".json,.yaml,.yml,.xml"
                      onChange={handleConfigUpload}
                      className="hidden" 
                      id="config-upload"
                    />
                    <label 
                      htmlFor="config-upload" 
                      className="cursor-pointer text-indigo-400 hover:text-indigo-300 text-xs"
                    >
                      رفع الإعدادات
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">نشر الوكلاء</label>
                  <div className="space-y-2">
                    <button 
                      onClick={() => deployAgent('new')}
                      className="w-full bg-green-500/20 text-green-300 px-3 py-2 rounded text-sm hover:bg-green-500/30 transition-colors"
                    >
                      🚀 نشر وكيل جديد
                    </button>
                    <button 
                      onClick={() => deployAgent('update')}
                      className="w-full bg-blue-500/20 text-blue-300 px-3 py-2 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      ⬆️ تحديث الوكلاء
                    </button>
                  </div>
                </div>
              </div>
            </HelperSection>

            {/* أدوات المراقبة */}
            <HelperSection id="monitoring" title="المراقبة والتطوير" icon={Brain}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">البحث في الوكلاء</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="البحث في الوكلاء..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
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

export default AiAgentsPage;