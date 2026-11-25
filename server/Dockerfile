# استخدام نسخة Node.js 25 الخفيفة والمخصصة للإنتاج
FROM node:25-alpine

WORKDIR /app

# نسخ ملفات الحزم أولاً للاستفادة من التخزين المؤقت (Docker Layer Caching)
COPY package*.json ./

# تثبيت حزم الإنتاج فقط لتقليل حجم الحاوية
RUN npm install --omit=dev

# نسخ باقي ملفات الكود المصدري
COPY . .

EXPOSE 5000

# تشغيل الخادم مباشرة باستخدام Node 25
CMD ["node", "src/index.ts"]
