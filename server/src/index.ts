import dns from 'node:dns';

// حل مشكلة DNS
dns.setDefaultResultOrder('ipv4first');
import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.ts';
import { initSocket } from './config/socket.ts';
import noteRoutes from './routes/noteRoutes.ts';
import { globalErrorHandler } from './middlewares/errorHandler.ts';

const app = express();
const httpServer = createServer(app); // إنشاء خادم HTTP ليدعم Express و Socket.io معاً
const PORT = process.env.PORT || 5000;

// 1. تهيئة قاعدة البيانات والاتصال اللحظي
connectDB();
initSocket(httpServer);

// 2. وسائط الأمان والحماية (Security Middlewares)
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '10kb' })); // حماية من إرسال حمولات ضخمة

// تحديد معدل الطلبات (100 طلب كل 15 دقيقة لكل IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'تجاوزت الحد المسموح من الطلبات، حاول لاحقاً.' },
});
app.use('/api', limiter);

// 3. المسارات (Routes)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Production-grade server is running!' });
});

app.use('/api/notes', noteRoutes);

// 4. معالج الأخطاء المركزي (يجب أن يكون في النهاية دائماً)
app.use(globalErrorHandler);

// تشغيل الخادم عبر httpServer بدلاً من app.listen
httpServer.listen(PORT, () => {
  console.log(`Server & WebSockets running on http://localhost:${PORT}`);
});
