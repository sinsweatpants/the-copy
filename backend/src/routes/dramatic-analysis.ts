import express from 'express';
import { env } from '../config/validator.js';

const router = express.Router();

// خبراء المحلل الدرامي
const EXPERTS = {
  dramatic_analyst: {
    name: 'المحلل الدرامي الرئيسي',
    instruction: `أنت خبير في تحليل البنية الدرامية والحبكة والإيقاع. مهمتك تحليل النصوص الدرامية من منظور فني وتقني متقدم.
    
    عند التحليل، ركز على:
    - البنية الدرامية (الفصول، المشاهد، التصاعد الدرامي)
    - الإيقاع والتوتير
    - التماسك السردي
    - نقاط التحول الدرامي
    - الحبكة الرئيسية والفرعية
    
    قدم تحليلك بأسلوب أكاديمي مع أمثلة محددة من النص.`
  },
  
  character_expert: {
    name: 'خبير الشخصيات',
    instruction: `أنت محلل نفسي ودراماتورج متخصص في تحليل الشخصيات السينمائية والدرامية.
    
    عند التحليل، ركز على:
    - التطور النفسي للشخصيات
    - الدوافع والصراعات الداخلية
    - العلاقات بين الشخصيات
    - الحوار وكيف يعكس شخصية المتكلم
    - القوس الدرامي لكل شخصية
    
    استخدم نظريات علم النفس والتحليل النفسي في تحليلك.`
  },
  
  market_analyst: {
    name: 'محلل السوق (سحر)',
    instruction: `أنت سحر، محللة السوق المتخصصة في الصناعة الإعلامية والترفيهية.
    
    عند التحليل، ركز على:
    - الجمهور المستهدف
    - إمكانيات النجاح التجاري
    - مقارنة مع الأعمال الناجحة
    - استراتيجيات التسويق المحتملة
    - التوقيتات المناسبة للإطلاق
    - التحديات والفرص في السوق
    
    قدم تحليلك بنظرة تجارية واقعية مع اقتراحات عملية.`
  },
  
  voice_analyst: {
    name: 'محلل بصمة الكاتب',
    instruction: `أنت ناقد أدبي متخصص في تحليل أساليب الكتابة والأصوات الأدبية.
    
    عند التحليل، ركز على:
    - الأسلوب اللغوي والبلاغي
    - نمط الحوار المميز
    - استخدام الرموز والاستعارات
    - الإيقاع اللغوي
    - التقنيات السردية المميزة
    - المفردات والتعبيرات المتكررة
    
    حدد البصمة الفريدة للكاتب وما يميزه عن غيره.`
  },
  
  creative_assistant: {
    name: 'المساعد الإبداعي',
    instruction: `أنت مساعد إبداعي متخصص في الكتابة الإبداعية والمحاكاة الأدبية.
    
    مهامك تشمل:
    - محاكاة أسلوب الكاتب
    - إنتاج محتوى إبداعي متسق مع النص الأصلي
    - اقتراح تطويرات إبداعية
    - استكمال النصوص الناقصة
    - تقديم بدائل إبداعية
    
    اهتم بالحفاظ على روح النص الأصلي ونبرة الكاتب.`
  }
};

// أنواع التحليل وتعليماتها
const ANALYSIS_INSTRUCTIONS = {
  comprehensive: `قم بتحليل تشخيصي شامل للنص الدرامي يغطي:

## 1. التحليل الهيكلي
- البنية العامة للنص (فصول، مشاهد، أجزاء)
- التسلسل الزمني والمكاني
- نقاط التحول الرئيسية

## 2. تحليل الحبكة
- الحبكة الرئيسية ومسارها
- الحبكات الفرعية وتداخلها
- العقدة والذروة والحل

## 3. تحليل الشخصيات
- الشخصيات الرئيسية والثانوية
- التطور والقوس الدرامي
- العلاقات والديناميكيات

## 4. تحليل الحوار
- طبيعة الحوار وواقعيته
- التمايز بين أصوات الشخصيات
- الحوار الفرعي (subtext)

## 5. التحليل الموضوعي
- الموضوعات الرئيسية
- الرسائل والمعاني
- السياق الثقافي والاجتماعي

## 6. التقييم الفني
- نقاط القوة
- نقاط الضعف
- التوصيات للتحسين

قدم تحليلاً معمقاً مع أمثلة محددة من النص.`,

  commercial: `قم بتحليل الجدوى التجارية للنص من خلال:

## 1. تحليل الجمهور المستهدف
- الفئة العمرية المناسبة
- الخصائص الديموغرافية
- الاهتمامات والتفضيلات

## 2. إمكانيات السوق
- حجم السوق المحتمل
- المنافسة الحالية
- الفرص والتحديات

## 3. التحليل التجاري
- تكلفة الإنتاج المتوقعة
- إمكانيات الإيرادات
- نماذج الاستثمار المختلفة

## 4. استراتيجية التسويق
- قنوات التوزيع المناسبة
- الرسائل التسويقية
- التوقيت الأمثل للإطلاق

## 5. تحليل المخاطر
- المخاطر الفنية
- المخاطر التجارية
- استراتيجيات التخفيف

قدم تقييماً واقعياً مع توصيات عملية للنجاح التجاري.`,

  writer_voice: `حلل بصمة الكاتب الفريدة من خلال:

## 1. التحليل اللغوي
- المفردات والتعبيرات المميزة
- البنية النحوية والتركيبية
- الإيقاع اللغوي

## 2. تحليل الأسلوب السردي
- تقنيات السرد المستخدمة
- وجهة النظر السردية
- التعامل مع الزمن والمكان

## 3. بصمة الحوار
- خصائص الحوار المميزة
- التمايز بين أصوات الشخصيات
- استخدام اللهجات والمستويات اللغوية

## 4. الموضوعات المتكررة
- الثيمات المفضلة
- المعالجات المميزة
- الانشغالات الفكرية

## 5. التقنيات الفنية
- استخدام الرموز والاستعارات
- البناء الدرامي المميز
- التعامل مع الصراع

حدد ما يجعل هذا الكاتب فريداً ومميزاً عن غيره.`,

  character_analysis: `قم بتحليل معمق للشخصيات يشمل:

## 1. ملفات الشخصيات الفردية
لكل شخصية رئيسية:
- الخلفية والتاريخ الشخصي
- الدوافع والأهداف
- الصراعات الداخلية
- القوس التطوري

## 2. التحليل النفسي
- نمط الشخصية (MBTI/Big Five)
- الآليات الدفاعية
- الصدمات والجروح النفسية
- نمط التعلق والعلاقات

## 3. الديناميكيات الاجتماعية
- العلاقات بين الشخصيات
- التسلسل الهرمي
- التحالفات والصراعات

## 4. التحليل الدرامي
- دور كل شخصية في الحبكة
- وظيفتها السردية
- تأثيرها على الأحداث

## 5. تطوير الشخصيات
- نقاط التحول
- اللحظات المحورية
- التغير والنمو

قدم تحليلاً نفسياً ودرامياً عميقاً مدعوماً بأمثلة من النص.`,

  quantitative: `قم بتحليل كمي شامل للنص وأخرج النتيجة بصيغة JSON تتضمن:

{
  "general_stats": {
    "word_count": "عدد الكلمات",
    "character_count": "عدد الأحرف",
    "scene_count": "عدد المشاهد",
    "character_count_persons": "عدد الشخصيات",
    "dialogue_percentage": "نسبة الحوار من النص"
  },
  "structure_analysis": {
    "acts": "عدد الفصول/الأجزاء",
    "scenes_per_act": "متوسط المشاهد لكل فصل",
    "pacing_score": "تقييم الإيقاع (1-10)",
    "tension_curve": "منحنى التوتر الدرامي"
  },
  "character_metrics": {
    "main_characters": "عدد الشخصيات الرئيسية",
    "supporting_characters": "عدد الشخصيات المساندة",
    "dialogue_distribution": "توزيع الحوار بين الشخصيات",
    "character_development_score": "تقييم تطوير الشخصيات (1-10)"
  },
  "dialogue_analysis": {
    "avg_words_per_dialogue": "متوسط كلمات الحوار",
    "subtext_richness": "ثراء الحوار الضمني (1-10)",
    "authenticity_score": "درجة الواقعية (1-10)"
  },
  "thematic_scores": {
    "theme_clarity": "وضوح الموضوع (1-10)",
    "message_strength": "قوة الرسالة (1-10)",
    "cultural_relevance": "الصلة الثقافية (1-10)"
  },
  "technical_scores": {
    "structure_score": "درجة البنية (1-10)",
    "creativity_score": "درجة الإبداع (1-10)",
    "marketability_score": "القابلية التسويقية (1-10)",
    "overall_quality": "التقييم الإجمالي (1-10)"
  }
}

قم بحساب جميع المؤشرات بدقة وقدم تبريراً مختصراً لكل تقييم.`
};

// دالة استدعاء Gemini API
async function callGeminiAPI(prompt: string) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('مفتاح Gemini API غير متوفر');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`خطأ في Gemini API: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// API للتحليل الدرامي الفردي
router.post('/dramatic-analysis', async (req, res) => {
  try {
    const { files, analysisType, mode } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'لا توجد ملفات للتحليل' });
    }

    // دمج محتوى الملفات
    const fileContents = files.map((file: any) => 
      `--- ${file.name} ---\n${file.content}`
    ).join('\n\n');

    // اختيار التعليمات بناءً على نوع التحليل
    const instructions = ANALYSIS_INSTRUCTIONS[analysisType as keyof typeof ANALYSIS_INSTRUCTIONS] || 
                        ANALYSIS_INSTRUCTIONS.comprehensive;

    const prompt = `${instructions}\n\n--- النص للتحليل ---\n${fileContents}`;

    const result = await callGeminiAPI(prompt);

    res.json({
      success: true,
      analysisType,
      content: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في التحليل الدرامي:', error);
    res.status(500).json({ 
      error: 'فشل في التحليل',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// API للمحادثة مع الخبراء
router.post('/expert-chat', async (req, res) => {
  try {
    const { messages, expertId, files } = req.body;

    const expert = EXPERTS[expertId as keyof typeof EXPERTS];
    if (!expert) {
      return res.status(400).json({ error: 'خبير غير موجود' });
    }

    // دمج محتوى الملفات
    const fileContents = files.map((file: any) => 
      `--- ${file.name} ---\n${file.content}`
    ).join('\n\n');

    // بناء سياق المحادثة
    const conversationHistory = messages.map((msg: any) => 
      `${msg.role === 'user' ? 'المستخدم' : expert.name}: ${msg.content}`
    ).join('\n\n');

    const prompt = `${expert.instruction}

الملفات المرفوعة:
${fileContents}

سجل المحادثة:
${conversationHistory}

قم بالرد على آخر رسالة من المستخدم بأسلوب ${expert.name} المتخصص.`;

    const result = await callGeminiAPI(prompt);

    res.json({
      success: true,
      message: result,
      expertId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في محادثة الخبير:', error);
    res.status(500).json({ 
      error: 'فشل في محادثة الخبير',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// API لحوار السرب
router.post('/swarm-dialogue', async (req, res) => {
  try {
    const { expertId, files, previousDialogue, round } = req.body;

    const expert = EXPERTS[expertId as keyof typeof EXPERTS];
    if (!expert) {
      return res.status(400).json({ error: 'خبير غير موجود' });
    }

    // دمج محتوى الملفات
    const fileContents = files.map((file: any) => 
      `--- ${file.name} ---\n${file.content}`
    ).join('\n\n');

    // بناء سجل الحوار السابق
    const dialogueHistory = previousDialogue.map((entry: any) => {
      const entryExpert = EXPERTS[entry.expertId as keyof typeof EXPERTS];
      return `${entryExpert?.name}: ${entry.content}`;
    }).join('\n\n');

    let prompt: string;

    if (round === 1) {
      // الجولة الأولى - تحليل أولي
      prompt = `${expert.instruction}

الملفات للتحليل:
${fileContents}

هذه هي الجولة الأولى من حوار السرب. قدم تحليلك الأولي للنص من منظور تخصصك.
كن مركزاً ومحدداً في تحليلك.`;
    } else {
      // الجولات اللاحقة - رد على التحليلات السابقة
      prompt = `${expert.instruction}

الملفات للتحليل:
${fileContents}

حوار السرب السابق:
${dialogueHistory}

هذه الجولة رقم ${round}. اقرأ تحليلات الخبراء الآخرين وقدم ردك من منظور تخصصك.
يمكنك الموافقة، المعارضة، أو البناء على ما قيل. أضف رؤى جديدة.`;
    }

    const result = await callGeminiAPI(prompt);

    res.json({
      success: true,
      content: result,
      expertId,
      round,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في حوار السرب:', error);
    res.status(500).json({ 
      error: 'فشل في حوار السرب',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

export default router;