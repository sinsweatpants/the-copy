import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Calendar } from 'lucide-react';
import { getUserScreenplays, createScreenplay, updateScreenplay, deleteScreenplay } from '@/api';

interface Screenplay {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ScreenplayManagerProps {
  onSelectScreenplay: (id: string, title: string) => void;
  currentScreenplayId?: string;
}

export default function ScreenplayManager({ onSelectScreenplay, currentScreenplayId }: ScreenplayManagerProps) {
  const [screenplays, setScreenplays] = useState<Screenplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadScreenplays();
  }, []);

  const loadScreenplays = async () => {
    try {
      setLoading(true);
      const data = await getUserScreenplays();
      setScreenplays(data as Screenplay[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const screenplay = await createScreenplay(newTitle.trim()) as Screenplay;
      setScreenplays(prev => [screenplay, ...prev]);
      setNewTitle('');
      setShowCreateModal(false);
      // Auto-select the new screenplay
      onSelectScreenplay(screenplay.id, screenplay.title);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      const updated = await updateScreenplay(id, editTitle.trim()) as Screenplay;
      setScreenplays(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      setEditingId(null);
      setEditTitle('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السيناريو؟')) return;

    try {
      await deleteScreenplay(id);
      setScreenplays(prev => prev.filter(s => s.id !== id));
      // If deleting current screenplay, clear selection
      if (id === currentScreenplayId) {
        onSelectScreenplay('', '');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-slate-600">جاري تحميل السيناريوهات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">سيناريوهاتي</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          سيناريو جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {screenplays.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg mb-2">لا يوجد سيناريوهات بعد</p>
            <p className="text-sm">ابدأ بإنشاء سيناريو جديد</p>
          </div>
        ) : (
          screenplays.map((screenplay) => (
            <div
              key={screenplay.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                screenplay.id === currentScreenplayId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onSelectScreenplay(screenplay.id, screenplay.title)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingId === screenplay.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleEdit(screenplay.id);
                      }}
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditTitle('');
                        }}
                        className="px-3 py-1 bg-slate-400 text-white rounded text-sm hover:bg-slate-500"
                      >
                        إلغاء
                      </button>
                    </form>
                  ) : (
                    <>
                      <h3 className="font-medium text-slate-900 mb-1">{screenplay.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(screenplay.updatedAt)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {editingId !== screenplay.id && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingId(screenplay.id);
                        setEditTitle(screenplay.title);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(screenplay.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">إنشاء سيناريو جديد</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  عنوان السيناريو
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل عنوان السيناريو"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTitle('');
                  }}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}