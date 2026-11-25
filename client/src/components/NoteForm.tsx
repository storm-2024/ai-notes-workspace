import { useActionState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { noteApi } from '../services/api';

interface FormState {
  error: string | null;
  success: boolean;
}

export function NoteForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const title = formData.get('title')?.toString().trim() || '';
      const content = formData.get('content')?.toString().trim() || '';

      if (!title || !content) {
        return { error: 'يرجى إدخال العنوان والمحتوى معاً.', success: false };
      }

      try {
        await noteApi.create(title, content);
        return { error: null, success: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  return (
    <form
      action={formAction}
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4"
    >
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        إضافة ملاحظة جديدة
      </h2>

      {state.error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {state.error}
        </div>
      )}

      <div>
        <input
          type="text"
          name="title"
          placeholder="عنوان الملاحظة (مثلاً: صيانة السيارة)"
          disabled={isPending}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
        />
      </div>

      <div>
        <textarea
          name="content"
          rows={3}
          placeholder="اكتب تفاصيل ملاحظتك هنا ليتم فهرستها ذكياً..."
          disabled={isPending}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري الفهرسة والحفظ...
          </>
        ) : (
          'حفظ الملاحظة'
        )}
      </button>
    </form>
  );
}
