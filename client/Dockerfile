# المرحلة الأولى: بناء ملفات React للإنتاج
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# المرحلة الثانية: تقديم الملفات عبر خادم Nginx الخفيف
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
