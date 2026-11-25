import { FileText, Clock } from 'lucide-react';
import type { Note } from '../types/note';

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
}

export function NoteList({ notes, isLoading }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-10 text-slate-500">
        جاري تحميل ملاحظاتك...
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
        لا توجد ملاحظات بعد. أضف أول ملاحظة لتبدأ!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 px-1">
        الملاحظات المحفوظة ({notes.length})
      </h3>
      <div className="grid gap-3">
        {notes.map((note) => (
          <div
            key={note._id}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                {note.title}
              </h4>
              <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(note.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
              {note.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
