import mongoose, { Schema, type InferSchemaType } from 'mongoose';

// 1. تعريف مخطط البيانات (Schema)
const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'عنوان الملاحظة مطلوب'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'محتوى الملاحظة مطلوب'],
    },
    embedding: {
      type: [Number],
      default: [],
      select: false, // إخفاء المتجهات في الاستعلامات العادية لتسريع الأداء
    },
  },
  {
    timestamps: true, // إضافة createdAt و updatedAt تلقائياً
  }
);

// 2. استخراج نوع البيانات تلقائياً لـ TypeScript (ميزة حديثة في Mongoose)
export type INote = InferSchemaType<typeof noteSchema>;

// 3. إنشاء وتصدير النموذج (Model)
export const Note = mongoose.model('Note', noteSchema);
