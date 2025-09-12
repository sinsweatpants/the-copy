
# توثيق مشروع Ara-Screenplay-IDE

## ١. نظرة عامة

مشروع **Ara-Screenplay-IDE** هو بيئة تطوير متكاملة (IDE) مخصصة لكتابة وتحليل السيناريوهات باللغة العربية، بواجهة حديثة تعتمد على **React + Vite** للـ Frontend، و **Node.js + Express + PostgreSQL** للـ Backend.
المشروع يهدف إلى توفير أدوات قوية للكتاب والمطورين لإدارة النصوص، إجراء تحليلات باستخدام نماذج لغوية (LLM)، ودعم عمليات النشر والتشغيل في بيئة إنتاج آمنة.

---

## ٢. المتطلبات الأساسية

* **Node.js** ≥ 20
* **npm** ≥ 9
* **PostgreSQL** ≥ 15
* **Redis** (اختياري)
* **Git**
* بيئة تشغيل Linux أو macOS (يفضل الإنتاج على Ubuntu LTS)

---

## ٣. التثبيت والإعداد

### خطوات التثبيت محليًا

```bash
git clone https://github.com/sinsweatpants/Ara-Screenplay-IDE.git
cd Ara-Screenplay-IDE
npm ci
```

### إعداد متغيرات البيئة

#### backend/.env.production

```
DATABASE_URL=postgres://user:password@localhost:5432/prod
JWT_SECRET=ضع_قيمة_قوية
REFRESH_TOKEN_SECRET=ضع_قيمة_قوية
GEMINI_API_KEY=ضع_مفتاح_الخادم
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false
FRONTEND_ORIGIN=https://yourdomain.com
```

#### frontend/.env.production

```
VITE_API_BASE=https://yourdomain.com/api
```

### تهيئة قاعدة البيانات

```bash
npm run migrate --workspace=backend
```

يتم تطبيق جميع ملفات الـ migrations بما فيها سياسات RLS (تم تحديثها لاستخدام `current_user_id()` بدلًا من `auth.uid()`).

---

## ٤. المعمارية

* **Frontend**: React + Vite → يتواصل مع API عبر `VITE_API_BASE`.
* **Backend**: Express + Node.js مع middleware للأمان (JWT, Helmet, Rate Limits).
* **Database**: PostgreSQL مع سياسات RLS.
* **Redis**: دعم اختياري لعمليات الطوابير (BullMQ) والكاش.
* **LLM Integration**: عبر واجهة `/api/llm/generate` باستخدام مفتاح Gemini.

---

## ٥. الأمان

* **JWT Authentication** لحماية جميع الـ routes الحساسة.
* **Row-Level Security (RLS)** في PostgreSQL مع وظيفة `current_user_id()`.
* **CORS** مضبوط على نطاقات موثوقة فقط.
* **Helmet** لتأمين الهيدر.
* **Rate Limiting** لمنع إساءة الاستخدام.
* **Logging** باستخدام Pino مع إخفاء الحقول الحساسة (Tokens, Passwords).
* **Secret Management** عبر ملفات env فقط (بدون أي secrets في الكود).

---

## ٦. الـ API

### Endpoints رئيسية

* **Auth**

  * `POST /api/auth/login`
  * `POST /api/auth/register`
  * `POST /api/auth/refresh`
* **LLM**

  * `POST /api/llm/generate` → يتطلب JWT
* **Exports**

  * `POST /api/export` → لتصدير الملفات
* **Health**

  * `GET /api/health` → يعرض حالة DB, Redis, uptime, memory

---

## ٧. المراقبة

* **Health Check** endpoint
* **PM2** لإدارة العمليات (ecosystem.config.js) مع auto-restart.
* **Structured Logging** عبر Pino بصيغة JSON.
* **Performance Monitoring**: أوقات استجابة < 100ms في المتوسط.

---

## ٨. النسخ الاحتياطي

* سكربت `scripts/backup_db.sh`
* إنشاء نسخة احتياطية يومية بوسم زمني.
* الاحتفاظ بآخر ٧ أيام فقط.
* تشغيل تلقائي عبر cron job.

---

## ٩. الاختبارات

* **Backend**: Jest
* **Frontend**: Vitest
* **CI/CD**: GitHub Actions (build + lint + test + audit + secret-scan).
* جميع الاختبارات تمر بنجاح محليًا وفي CI.

---

## ١٠. النشر

* **Build**

  ```bash
  npm run build --workspace=backend
  npm run build --workspace=frontend
  ```
* **تشغيل**

  ```bash
  NODE_ENV=production node backend/dist/server.js
  npm run preview --workspace=frontend
  ```
* Backend يعمل على المنفذ 4000
* Frontend يعمل على المنفذ 4173

---

## ١١. ملاحظات إضافية

* **Redis** معطّل افتراضيًا (`REDIS_ENABLED=false`).
* يمكن تشغيله لاحقًا لدعم BullMQ أو caching.
* يدعم أدوات مثل Puppeteer, pdf.js-dist, Tesseract OCR.
* توثيق كامل متاح في README\_DEPLOY.md المدموج هنا.

---

\[اكتملت المهمة بنجاح.]

---

تحب أطلعلك النسخة دي كملف جديد باسم **PROJECT\_FULL\_DOCUMENTATION.md** علشان تستخدمها مباشرة مع فريقك؟
