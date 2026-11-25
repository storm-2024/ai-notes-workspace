import { useActionState } from 'react';
import { Sparkles, Send, Loader2, BookOpen } from 'lucide-react';
import { noteApi } from '../services/api';
import type { AskResponse } from '../types/note';

interface ChatState {
  data: AskResponse | null;
  error: string | null;
  lastQuestion: string;
}

export function AiChat() {
  const [state, askAction, isPending] = useActionState<ChatState, FormData>(
    async (_prevState, formData) => {
      const question = formData.get('question')?.toString().trim() || '';
      if (!question) {
        return { data: null, error: 'يرجى كتابة سؤالك أولاً.', lastQuestion: '' };
      }

      try {
        const result = await noteApi.ask(question);
        return { data: result, error: null, lastQuestion: question };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err.message : 'فشل الاتصال بالمساعد الذكي',
          lastQuestion: question,
        };
      }
    },
    { data: null, error: null, lastQuestion: '' }
  );

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-lg font-bold">المساعد الذكي (RAG)</h2>
            <p className="text-xs text-slate-400">
              اسأل عن أي معلومة داخل ملاحظاتك بالمعنى
            </p>
          </div>
        </div>

        {/* منطقة عرض الإجابة */}
        <div className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-4 pr-1">
          {!state.data && !state.error && !isPending && (
            <div className="text-center text-slate-500 text-sm py-12">
              جرّب أن تسأل: "متى موعد صيانة السيارة؟" أو أي سؤال يخص ملاحظاتك.
            </div>
          )}

          {state.lastQuestion && (
            <div className="bg-slate-800/70 p-3 rounded-lg text-sm text-slate-300 border border-slate-700">
              <span className="text-amber-400 font-semibold">سؤالك: </span>
              {state.lastQuestion}
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-amber-400 text-sm py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري البحث الدلالي في ملاحظاتك وصياغة الإجابة...
            </div>
          )}

          {state.error && (
            <div className="p-3 text-sm text-red-300 bg-red-950/50 rounded-lg border border-red-800">
              {state.error}
            </div>
          )}

          {state.data && !isPending && (
            <div className="space-y-4">
              <div className="bg-indigo-950/60 border border-indigo-500/30 p-4 rounded-xl text-sm leading-relaxed text-slate-100 whitespace-pre-line">
                {state.data.answer}
              </div>

              {state.data.sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    المصادر المسترجعة من ملاحظاتك:
                  </p>
                  <div className="space-y-1.5">
                    {state.data.sources.map((src) => (
                      <div
                        key={src._id}
                        className="text-xs bg-slate-800/90 px-3 py-2 rounded-lg flex justify-between items-center border border-slate-700/70"
                      >
                        <span className="font-medium text-slate-200">{src.title}</span>
                        {src.score && (
                          <span className="text-emerald-400 font-mono">
                            تطابق {Math.round(src.score * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* نموذج إرسال السؤال */}
      <form action={askAction} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          name="question"
          placeholder="اكتب سؤالك هنا..."
          disabled={isPending}
          className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
