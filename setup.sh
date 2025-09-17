#!/bin/bash

# Script لتشغيل المحلل الدرامي والمبدع المحاكي

echo "🎭 تشغيل المحلل الدرامي والمبدع المحاكي"
echo "========================================"

# تحقق من متطلبات النظام
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js 20 أو أحدث"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت"
    exit 1
fi

echo "✅ تحقق من المتطلبات مكتمل"

# تثبيت التبعيات إذا لم تكن موجودة
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    npm ci
fi

# إنشاء ملفات البيئة إذا لم تكن موجودة
if [ ! -f "backend/.env.production" ]; then
    echo "⚙️ إنشاء ملف البيئة للخادم..."
    cp backend/.env.production.example backend/.env.production
    echo "⚠️  تحذير: يرجى تحديث ملف backend/.env.production بالقيم الصحيحة"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "⚙️ إنشاء ملف البيئة للواجهة..."
    echo "VITE_API_BASE=http://localhost:4000/api" > frontend/.env.production
fi

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ البناء مكتمل بنجاح"
    
    echo ""
    echo "🚀 المشروع جاهز للتشغيل!"
    echo ""
    echo "للتشغيل في بيئة التطوير:"
    echo "  npm run dev"
    echo ""
    echo "للتشغيل في بيئة الإنتاج:"
    echo "  npm run start:prod"
    echo ""
    echo "📝 ملاحظات مهمة:"
    echo "1. تأكد من تحديث backend/.env.production بمفتاح Gemini API"
    echo "2. تأكد من إعداد قاعدة البيانات PostgreSQL إذا كنت تريد استخدامها"
    echo "3. المشروع يعمل بدون قاعدة بيانات افتراضياً"
    echo ""
    echo "🎭 المحلل الدرامي جاهز للاستخدام!"
    
else
    echo "❌ فشل في البناء"
    exit 1
fi