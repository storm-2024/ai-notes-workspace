import { GoogleGenAI } from '@google/genai';

// تهيئة العميل (يقرأ GEMINI_API_KEY تلقائياً من ملف .env)
const ai = new GoogleGenAI({});

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * تحويل النص إلى متجه رقمي (Embedding Vector) للبحث الدلالي
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    const firstEmbedding = response.embeddings?.at(0);
    if (!firstEmbedding || !firstEmbedding.values) {
      throw new Error('لم يتم إرجاع أي متجهات من نموذج التضمين.');
    }

    return firstEmbedding.values as number[];
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

/**
 * توليد إجابة ذكية بناءً على الملاحظات المسترجعة فقط (تقنية RAG)
 * مع التحويل التلقائي الفوري إلى Groq Llama 3.3 عند انشغال خوادم Gemini
 */
export const generateAnswer = async (
  question: string,
  contextNotes: string[]
): Promise<string> => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const context =
    contextNotes.length > 0
      ? contextNotes.join('\n---\n')
      : 'لا توجد ملاحظات ذات صلة.';

  const systemPrompt = `أنت مساعد ذكي شخصي. أجب عن سؤال المستخدم بالاعتماد حصرياً على الملاحظات التالية. إذا لم تجد الإجابة في الملاحظات، قل بوضوح: "لم أجد معلومات حول هذا في ملاحظاتك".`;
  const userPrompt = `الملاحظات المتاحة:\n${context}\n\nسؤال المستخدم: ${question}`;

  // 1. المحاولة الأولى عبر Google Gemini (مهلة سريعة 6 ثوانٍ)
  if (geminiKey) {
    try {
      const host = 'generativelanguage' + '.googleapis.com';
      const url = `https://${host}/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse;
        const text = data.candidates?.at(0)?.content?.parts?.at(0)?.text;
        if (text) return text;
      }
      console.warn(`Gemini busy (${response.status}), switching to Groq fallback...`);
    } catch {
      console.warn('Gemini timeout or error, switching to Groq fallback...');
    }
  }

  // 2. البديل السحابي فائق السرعة عبر Groq API (Llama 3.3 70B)
  if (groqKey) {
    const groqHost = 'api' + '.groq.com';
    const groqUrl = `https://${groqHost}/openai/v1/chat/completions`;

    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = (await response.json()) as ChatCompletionResponse;

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return data.choices?.at(0)?.message?.content || 'عذراً، لم أتمكن من صياغة إجابة.';
  }

  throw new Error('503 UNAVAILABLE: خوادم الذكاء الاصطناعي مزدحمة حالياً.');
};
