import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

describe('Production Readiness API Suite', () => {
  // 1. اختبار جاهزية الخادم وترويسات الأمان (Helmet)
  it('GET /health - should return 200 and security headers', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(res.headers.get('x-content-type-options'), 'Helmet security header is missing!');
  });

  // 2. اختبار الحماية من المدخلات الناقصة (Input Validation)
  it('POST /notes - should reject empty payload with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }), // إرسال بيانات ناقصة عمداً
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.status, 'error');
  });

  // 3. اختبار رفض الأسئلة الفارغة في المساعد الذكي
  it('POST /notes/ask - should reject empty question with 400', async () => {
    const res = await fetch(`${BASE_URL}/notes/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.strictEqual(res.status, 400);
  });
});
