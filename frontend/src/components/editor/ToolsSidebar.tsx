import React, { useState } from 'react';
import { Settings, FileText, Upload, Download, Code, Palette, Bug, Zap, Database, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: 'file' | 'ui' | 'dev';
  description: string;
  component: React.ComponentType<any>;
}

interface ToolsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Helper Components
const FileUploadTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">File Upload</h3>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Drag files here or click to select</p>
      <input type="file" multiple className="hidden" />
    </div>
  </div>
);

const QuickFormatTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">Quick Format</h3>
    <div className="space-y-2">
      <button className="w-full bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200">
        Format JSON
      </button>
      <button className="w-full bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200">
        Format CSS
      </button>
    </div>
  </div>
);

const ColorPaletteTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">Color Palette</h3>
    <div className="grid grid-cols-5 gap-2">
      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
        <div
          key={color}
          className="w-8 h-8 rounded cursor-pointer border-2 border-white shadow-sm"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  </div>
);

const DebugConsoleTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">Debug Console</h3>
    <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
      <div>✓ Component loaded</div>
      <div>⚠ Warning: Deprecated prop</div>
      <div>✗ Error: Network request failed</div>
    </div>
  </div>
);

const PerformanceMonitorTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">Performance Monitor</h3>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Memory:</span>
        <span className="font-medium">45.2 MB</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Load Time:</span>
        <span className="font-medium">1.3s</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
      </div>
    </div>
  </div>
);

const SearchTool = () => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-800">Quick Search</h3>
    <div className="relative">
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search in code..."
        className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>
);

const ToolsSidebar: React.FC<ToolsSidebarProps> = ({ isOpen, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState<'file' | 'ui' | 'dev'>('file');

  const tools: Tool[] = [
    {
      id: 'file-upload',
      name: 'File Upload',
      icon: Upload,
      category: 'file',
      description: 'Upload and process files',
      component: FileUploadTool
    },
    {
      id: 'quick-format',
      name: 'Quick Format',
      icon: Code,
      category: 'file',
      description: 'Format code and data',
      component: QuickFormatTool
    },
    {
      id: 'color-palette',
      name: 'Color Palette',
      icon: Palette,
      category: 'ui',
      description: 'Choose and manage colors',
      component: ColorPaletteTool
    },
    {
      id: 'debug-console',
      name: 'Debug Console',
      icon: Bug,
      category: 'dev',
      description: 'Track errors and messages',
      component: DebugConsoleTool
    },
    {
      id: 'performance-monitor',
      name: 'Performance Monitor',
      icon: Zap,
      category: 'dev',
      description: 'Monitor app performance',
      component: PerformanceMonitorTool
    },
    {
      id: 'search-tool',
      name: 'Quick Search',
      icon: Search,
      category: 'dev',
      description: 'Search in code and files',
      component: SearchTool
    }
  ];

  const categories = [
    { id: 'file' as const, name: 'Files', icon: FileText, color: 'text-blue-600' },
    { id: 'ui' as const, name: 'Interface', icon: Palette, color: 'text-purple-600' },
    { id: 'dev' as const, name: 'Development', icon: Settings, color: 'text-green-600' }
  ];

  const activeTools = tools.filter(tool => tool.category === activeCategory);

  return (
    <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-md border-r border-purple-500/30 shadow-2xl transition-all duration-500 z-40 ${
      isOpen ? 'w-96' : 'w-0'
    } overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
        <h2 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Helper Tools
        </h2>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 group border border-transparent hover:border-purple-400/30"
        >
          <X className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-purple-500/20 bg-white/5">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 flex flex-col items-center py-4 px-3 text-sm font-semibold transition-all duration-300 relative group ${
                activeCategory === category.id
                  ? `${category.color} bg-gradient-to-b from-white/10 to-white/5 border-b-2 border-current shadow-lg`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 transition-all duration-300 ${
                activeCategory === category.id ? 'scale-110' : 'group-hover:scale-105'
              }`} />
              <span>{category.name}</span>
              {activeCategory === category.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tools Content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        {activeTools.map(tool => {
          const ToolComponent = tool.component;
          return (
            <div key={tool.id} className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 backdrop-blur-sm group">
              <div className="transform group-hover:scale-[1.02] transition-transform duration-300">
                <ToolComponent />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Toggle Button Component
export const ToolsToggleButton: React.FC<{ onClick: () => void; isOpen: boolean }> = ({ onClick, isOpen }) => (
  <button
    onClick={onClick}
    className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-md border border-purple-400/30 rounded-2xl p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 group ${
      isOpen ? 'translate-x-96' : 'translate-x-0'
    } hover:scale-110`}
    title="Helper Tools"
  >
    <div className="relative">
      {isOpen ? (
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      ) : (
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      )}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
    </div>
  </button>
);

export default ToolsSidebar;