import { type Request, type Response } from 'express';
import { Note } from '../models/Note.ts';
import { generateEmbedding, generateAnswer } from '../services/aiService.ts';
import { AppError } from '../middlewares/errorHandler.ts';
import { getIO } from '../config/socket.ts';

/**
 * @desc    إنشاء ملاحظة جديدة، توليد المتجهات، وبثها لحظياً للمتصلين
 * @route   POST /api/notes
 */
export const createNote = async (req: Request, res: Response): Promise<void> => {
  const { title, content } = req.body;

  if (!title || !content) {
    throw new AppError('يرجى إدخال عنوان ومحتوى الملاحظة.', 400);
  }

  const textToEmbed = `${title}\n${content}`;
  const embedding = await generateEmbedding(textToEmbed);

  const newNote = await Note.create({
    title,
    content,
    embedding,
  });

  const noteResponse = {
    _id: newNote._id,
    title: newNote.title,
    content: newNote.content,
    createdAt: newNote.createdAt,
  };

  getIO().emit('note:created', noteResponse);

  res.status(201).json({
    status: 'success',
    data: noteResponse,
  });
};

/**
 * @desc    جلب جميع الملاحظات مرتبة من الأحدث للأقدم
 * @route   GET /api/notes
 */
export const getAllNotes = async (_req: Request, res: Response): Promise<void> => {
  const notes = await Note.find().sort({ createdAt: -1 });

  res.json({
    status: 'success',
    results: notes.length,
    data: notes,
  });
};

/**
 * @desc    البحث الدلالي في الملاحظات والإجابة عن سؤال المستخدم (RAG)
 * @route   POST /api/notes/ask
 */
export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body;

  if (!question) {
    throw new AppError('يرجى كتابة سؤالك أولاً.', 400);
  }

  console.time('1-Embedding');
  const queryVector = await generateEmbedding(question);
  console.timeEnd('1-Embedding');

  console.time('2-VectorSearch');
  const relevantNotes = await Note.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryVector,
        numCandidates: 50,
        limit: 3,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);
  console.timeEnd('2-VectorSearch');

  const contextNotes = relevantNotes.map(
    (note) => `العنوان: ${note.title}\nالمحتوى: ${note.content}`
  );

  console.time('3-GeminiAnswer');
  const answer = await generateAnswer(question, contextNotes);
  console.timeEnd('3-GeminiAnswer');

  res.json({
    status: 'success',
    answer,
    sources: relevantNotes,
  });
};
