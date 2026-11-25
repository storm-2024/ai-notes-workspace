import { GoogleGenAI } from '@google/genai';

// تهيئة العميل (يقرأ GEMINI_API_KEY تلقائياً من ملف .env)
const ai = new GoogleGenAI({});

/**
 * تحويل النص إلى مصفوفة أرقام (Embedding) للبحث الدلالي
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        outputDimensionality: 768, // تحديد 768 بُعداً لتتوافق مع إعدادات MongoDB Atlas
      },
    });

    // التحقق من وجود القيم وإرجاعها
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding values');
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};





interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export const generateAnswer = async (
  question: string,
  contextNotes: string[]
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const context =
    contextNotes.length > 0
      ? contextNotes.join('\n---\n')
      : 'لا توجد ملاحظات ذات صلة.';

  const prompt = `
أنت مساعد ذكي شخصي. أجب عن سؤال المستخدم بالاعتماد حصرياً على الملاحظات التالية.
إذا لم تجد الإجابة في الملاحظات، قل بوضوح: "لم أجد معلومات حول هذا في ملاحظاتك".

الملاحظات المتاحة:
${context}

سؤال المستخدم: ${question}
`;

  const models = ['gemma-3-12b-it', 'gemma-3-27b-it','gemini-flash-latest', 'gemini-3.8-flash'];



  let lastErrorText = '';

  for (const model of models) {
    const host = 'generativelanguage' + '.googleapis.com';
    const path = `/v1beta/models/${model}:generateContent`;
    const url = `https://${host}${path}?key=${apiKey}`;


    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // generationConfig: {
        //   thinkingConfig: { thinkingBudget: 0 },
        // },
      }),

     signal: AbortSignal.timeout(15000),

    });

    const data = (await response.json()) as GeminiResponse;

    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || 'عذراً، لم أتمكن من صياغة إجابة.';
    }

    lastErrorText = JSON.stringify(data);
    console.warn(`Model ${model} returned ${response.status}, trying fallback...`);
  }

  throw new Error(lastErrorText);
};
