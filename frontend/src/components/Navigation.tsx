import React from 'react';
import { Home, Edit3, BarChart3, Bot, FileText } from 'lucide-react';

type CurrentPage = 'home' | 'editor' | 'analyzer' | 'ai-agents' | 'text-analysis';

interface NavigationProps {
  currentPage: CurrentPage;
  onNavigate: (page: CurrentPage) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { 
      id: 'home' as CurrentPage, 
      label: 'الرئيسية', 
      icon: Home,
      color: 'text-gray-600 hover:text-purple-600'
    },
    { 
      id: 'editor' as CurrentPage, 
      label: 'المحرر', 
      icon: Edit3,
      color: 'text-purple-600 hover:text-purple-700'
    },
    { 
      id: 'analyzer' as CurrentPage, 
      label: 'المحلل الدرامي', 
      icon: BarChart3,
      color: 'text-blue-600 hover:text-blue-700'
    },
    { 
      id: 'ai-agents' as CurrentPage, 
      label: 'الوكلاء الذكية', 
      icon: Bot,
      color: 'text-indigo-600 hover:text-indigo-700'
    },
    { 
      id: 'text-analysis' as CurrentPage, 
      label: 'تحليل النصوص', 
      icon: FileText,
      color: 'text-green-600 hover:text-green-700'
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md border-b border-purple-500/20 shadow-2xl sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="relative">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                the-copy
              </h1>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-reverse space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group relative flex items-center space-x-reverse space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-500/25 border border-purple-400/50' 
                      : `${item.color} hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/20`
                  }`}
                >
                  <Icon size={20} className={`transition-all duration-300 ${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="relative group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 transform group-hover:scale-110 cursor-pointer">
                <span className="text-white text-lg font-bold">م</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
    </nav>
  );
};

export default Navigation;