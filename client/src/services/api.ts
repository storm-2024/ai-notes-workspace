import type { Note, AskResponse } from '../types/note';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes`;

// دالة مساعدة لتغليف طلبات الشبكة بمهلة زمنية قصوى (Timeout)
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('استغرق الخادم وقتاً طويلاً للرد، يرجى التحقق من اتصالك والمحاولة مجدداً.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const noteApi = {
  // جلب جميع الملاحظات (مهلة 10 ثوانٍ)
  getAll: async (): Promise<Note[]> => {
    const res = await fetchWithTimeout(BASE_URL, {}, 10000);
    if (!res.ok) throw new Error('فشل في جلب الملاحظات');
    const json = await res.json();
    return json.data;
  },

  // إنشاء ملاحظة جديدة وفهرستها (مهلة 15 ثانية)
  create: async (title: string, content: string): Promise<Note> => {
    const res = await fetchWithTimeout(
      BASE_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      },
      15000
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'فشل في حفظ الملاحظة');
    return json.data;
  },

  // سؤال المساعد الذكي (مهلة 20 ثانية لدعم محاولات Model Fallback في الخادم)
  ask: async (question: string): Promise<AskResponse> => {
    const res = await fetchWithTimeout(
      `${BASE_URL}/ask`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      },
      40000 
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'حدث خطأ أثناء معالجة السؤال');
    return json;
  },
};
