import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function UserBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          <User size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{user.username}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
      >
        <LogOut size={16} />
        تسجيل الخروج
      </button>
    </div>
  );
}