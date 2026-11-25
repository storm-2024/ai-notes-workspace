import { useEffect, useState } from 'react';
import { BrainCircuit, Wifi, WifiOff } from 'lucide-react';
import { NoteForm } from './components/NoteForm';
import { NoteList } from './components/NoteList';
import { AiChat } from './components/AiChat';
import { noteApi } from './services/api';
import { socket } from './services/socket';
import type { Note } from './types/note';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // 1. جلب الملاحظات الأولية من الخادم عند فتح التطبيق
    const fetchInitialNotes = async () => {
      try {
        const data = await noteApi.getAll();
        setNotes(data);
      } catch (error) {
        console.error('Failed to load initial notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialNotes();

    // 2. مراقبة حالة الاتصال اللحظي بالخادم (Socket.io)
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // 3. الاستماع لحدث إضافة ملاحظة جديدة من الخادم
    const handleNoteCreated = (newNote: Note) => {
      setNotes((prevNotes) => {
        // منع التكرار في حال وصول الحدث مرتين
        if (prevNotes.some((n) => n._id === newNote._id)) return prevNotes;
        return [newNote, ...prevNotes];
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('note:created', handleNoteCreated);

    // 4. تنظيف المستمعات (Cleanup) عند إغلاق المكون لمنع تسرب الذاكرة
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('note:created', handleNoteCreated);
    };
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* الشريط العلوي (Header) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                مساحة العمل الذكية
              </h1>
              <p className="text-xs text-slate-500">
                MERN Stack + Vector Search + WebSockets
              </p>
            </div>
          </div>

          {/* مؤشر حالة الاتصال اللحظي */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                متصل لحظياً
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                غير متصل
              </>
            )}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي (مقسم إلى عمودين على الشاشات الكبيرة) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* العمود الأيمن: إضافة وعرض الملاحظات (7 أعمدة) */}
          <div className="lg:col-span-7 space-y-6">
            <NoteForm />
            <NoteList notes={notes} isLoading={isLoading} />
          </div>

          {/* العمود الأيسر: المساعد الذكي (5 أعمدة) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <AiChat />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
