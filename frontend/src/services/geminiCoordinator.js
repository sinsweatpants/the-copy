
export class GeminiCoordinator {
    #apiKey = null;
    #apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
  
    /**
     * @param {string} [apiKey] - يمكن تمرير مفتاح API عند الإنشاء.
     */
    constructor(apiKey) {
      if (apiKey) {
        this.setApiKey(apiKey);
      }
    }
  
    /**
     * تعيين مفتاح API لاستخدامه في جميع الطلبات.
     * @param {string} key - مفتاح Google Gemini API.
     * @returns {boolean} - true إذا تم تعيين المفتاح بنجاح.
     */
    setApiKey(key) {
      if (typeof key === 'string' && key.length > 10) {
        this.#apiKey = key;
        return true;
      }
      console.error("[Coordinator] مفتاح API غير صالح.");
      return false;
    }
    
    /**
     * @private
     * الدالة المركزية والخاصة لإجراء جميع استدعاءات Gemini API.
     * تعالج المصادقة، وتطلب استجابة JSON، وتدير الأخطاء الأساسية.
     */
    async #makeApiCall(prompt, generationConfig = {}) {
      if (!this.#apiKey) throw new Error("لم يتم تكوين مفتاح Gemini API.");
  
      try {
        const response = await fetch(`${this.#apiEndpoint}?key=${this.#apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2, // درجة حرارة منخفضة لنتائج متوقعة
              ...generationConfig,
            },
          }),
        });
  
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`خطأ في Gemini API: ${response.status} - ${errorBody}`);
        }
        
        const data = await response.json();
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) throw new Error("استجابة فارغة من Gemini.");
        
        return JSON.parse(textContent);
  
      } catch (error) {
        console.error("[Coordinator] فشل استدعاء API:", error);
        throw error; // نترك للدالة المستدعية التعامل مع الخطأ
      }
    }
  
  function buildAdvancedAuditPrompt(lines, options = {}) {
    const allowedClasses = JSON.stringify([
      'character', 'dialogue', 'parenthetical', 'action',
      'scene-header-1', 'scene-header-2', 'scene-header-3', 'transition',
      'slug-line', 'montage', 'insert', 'fade-in', 'fade-out',
      'title-card', 'super', 'flashback', 'flashforward', 'voice-over',
      'off-screen', 'continuous', 'series-of-shots', 'intercut'
    ]);
  
    const contextWindow = options.contextWindow || 5;
    const confidenceThreshold = options.confidenceThreshold || 'adaptive';
    const includeMetrics = options.includeMetrics !== false;
    const deepAnalysis = options.deepAnalysis || true;
    const culturalContext = options.culturalContext || 'arabic-modern';
    const dialectSupport = options.dialectSupport || ['msa', 'egyptian', 'levantine', 'gulf'];
  
    return `### نظام تدقيق النصوص السينمائية العربية المتطور - الإصدار 2.0
  
  ## 🎬 الهوية والخبرة
  أنت نظام ذكاء اصطناعي متخصص في التحليل العميق للنصوص السينمائية العربية، مُدرَّب على آلاف السيناريوهات من مختلف الأنواع السينمائية. تمتلك:
  - خبرة 15+ عاماً في تحليل النصوص السينمائية العربية والعالمية
  - فهم عميق للهجات العربية المختلفة وتأثيرها على التصنيف
  - إلمام كامل بمعايير الصناعة السينمائية (Hollywood, Bollywood, السينما العربية)
  - قدرة على التعرف على الأساليب الإخراجية المختلفة وتأثيرها على التنسيق
  - معرفة بالسياق الثقافي والاجتماعي للإنتاج العربي
  
  ## 🎯 المهمة الأساسية المُحدَّثة
  تحليل متعدد المستويات لأسطر السيناريو المُصنَّفة، باستخدام:
  1. **التحليل البنيوي**: فحص هيكل السيناريو والتدفق السردي
  2. **التحليل اللغوي**: دراسة الأنماط اللغوية والنحوية
  3. **التحليل السياقي**: فهم السياق الدرامي والثقافي
  4. **التحليل التنبؤي**: توقع التصنيفات المحتملة بناءً على الأنماط
  5. **التحليل المقارن**: مقارنة مع أنماط السيناريوهات المماثلة
  
  ## 📊 البيانات المُدخلة المُوسَّعة
  ستتلقى مصفوفة JSON \`lines\` حيث كل كائن يحتوي على:
  \`\`\`json
  {
    "index": "رقم السطر الفريد",
    "raw": "النص العربي الأصلي",
    "cls": "التصنيف الحالي",
    "context": {
      "before": ["الأسطر السابقة"],
      "after": ["الأسطر اللاحقة"]
    },
    "metadata": {
      "lineLength": "عدد الكلمات",
      "punctuation": "علامات الترقيم المستخدمة",
      "dialect": "اللهجة المُكتشفة",
      "emotionalTone": "النبرة العاطفية",
      "narrativePosition": "الموقع في السرد"
    },
    "confidence": "مستوى ثقة التصنيف الأولي",
    "alternatives": ["تصنيفات بديلة محتملة"]
  }
  \`\`\`
  
  ## 📚 مجموعة التصنيفات المُوسَّعة
  ${allowedClasses}
  
  ### تعريفات التصنيفات التفصيلية:
  - **character**: اسم الشخصية (قد يتضمن حالة عاطفية أو وصف موجز)
  - **dialogue**: الحوار المنطوق (يشمل الحوار الداخلي إذا مُحدد)
  - **parenthetical**: التوجيهات التمثيلية (نبرة، حركة صغيرة، إيماءة)
  - **action**: وصف الأحداث والحركة (يشمل وصف المكان والأجواء)
  - **transition**: انتقالات بين المشاهد (قطع إلى، تلاشي، مزج)
  - **slug-line**: عنوان فرعي داخل المشهد
  - **montage**: سلسلة من اللقطات المترابطة
  - **insert**: إدراج لقطة تفصيلية
  - **fade-in/fade-out**: بداية أو نهاية تدريجية
  - **title-card**: بطاقة عنوان أو نص توضيحي
  - **super**: نص مُركَّب على الصورة
  - **flashback/flashforward**: ذكريات الماضي أو استباق المستقبل
  - **voice-over**: صوت الراوي أو التعليق الصوتي
  - **off-screen**: صوت من خارج الكادر
  - **continuous**: استمرارية المشهد
  - **series-of-shots**: سلسلة لقطات متتابعة
  - **intercut**: تقاطع بين مشهدين أو أكثر
  
  ## 🔍 عملية التحليل المُتقدمة
  
  ### المرحلة 1: التحليل الأولي الشامل
  1. **مسح البنية العامة**: تحديد نمط السيناريو والأسلوب المُتَّبع
  2. **كشف اللهجة والأسلوب**: تحديد اللهجة العربية المستخدمة
  3. **تحليل الإيقاع السردي**: فهم سرعة وتدفق الأحداث
  4. **رسم خريطة الشخصيات**: تتبع ظهور الشخصيات وأنماط حواراتها
  
  ### المرحلة 2: التحليل السياقي العميق
  نافذة السياق الديناميكية: ${contextWindow} أسطر (قابلة للتوسع حسب الحاجة)
  
  #### معايير التحليل السياقي:
  1. **التماسك السردي**: هل التصنيف يدعم التدفق الطبيعي للقصة؟
  2. **التناسق الأسلوبي**: هل يتماشى مع أسلوب الكاتب؟
  3. **المنطق الدرامي**: هل يخدم الهدف الدرامي للمشهد؟
  4. **القواعد النحوية**: هل يتوافق مع قواعد اللغة العربية؟
  5. **السياق الثقافي**: هل يراعي الخصوصيات الثقافية؟
  
  ### المرحلة 3: تطبيق القواعد الذكية المُحسَّنة
  
  #### 🔴 قواعد الأولوية القصوى (ثقة 95-100%):
  1. **قاعدة الحوار المباشر المُطوَّرة**:
     - الشرط: سطر يتبع \`character\` مباشرة
     - المحتوى: 3+ كلمات، جملة كاملة أو شبه كاملة
     - البداية: ليست بكلمة وصفية (يدخل، يخرج، يقف)
     - الخصائص اللغوية:
       * يحتوي على ضمائر المخاطب أو المتكلم
       * يبدأ بأدوات استفهام عربية (هل، أين، متى، كيف، لماذا، من، ما)
       * يحتوي على أفعال أمر أو نداء
       * ينتهي بعلامات استفهام أو تعجب
     - التصنيف المُصحَّح: \`dialogue\`
     - الاستثناءات: إذا كان بين أقواس → \`parenthetical\`
  
  2. **قاعدة الشخصية المُدمجة المُتقدمة**:
     - الأنماط المُحدَّدة:
       * \`الاسم:\` أو \`الاسم :\` → فصل إلى \`character\` + \`dialogue\`
       * \`الاسم -\` أو \`الاسم–\` → فصل مماثل
       * \`الاسم (حالة):\` → \`character\` مع الحالة كـ\`parenthetical\`
     - معالجة الأسماء المركبة: (أبو محمد، أم سالم، عبد الله)
     - معالجة الألقاب: (الدكتور، المهندس، الحاج)
  
  3. **قاعدة رؤوس المشاهد الهرمية**:
     - التسلسل الصحيح:
  4. **قاعدة التوجيهات التمثيلية المُحسَّنة**:
     - الموقع: بين أقواس () بعد اسم الشخصية أو وسط الحوار
     - المحتوى النموذجي:
       * حالات عاطفية: (بغضب)، (بحزن)، (مبتسماً)
       * أفعال صغيرة: (يلتفت)، (ينظر للساعة)، (يتنهد)
       * نبرة الصوت: (همساً)، (صارخاً)، (متلعثماً)
     - الطول: عادة 1-5 كلمات
     - التصنيف: \`parenthetical\`
  
  #### 🟡 قواعد الأولوية المتوسطة (ثقة 70-94%):
  5. **قاعدة الانتقالات السينمائية**:
     - الكلمات المفتاحية:
       * قطع إلى، يقطع إلى، CUT TO
       * تلاشي إلى، FADE TO، ذوبان إلى
       * مزج إلى، DISSOLVE TO
       * قطع مباشر، SMASH CUT
     - الموقع: عادة في نهاية المشهد أو بدايته
     - التنسيق: غالباً بأحرف كبيرة أو منفصل
  
  6. **قاعدة الأفعال الوصفية التفصيلية**:
     - الطول: 8+ كلمات
     - المحتوى: وصف للحركة، المكان، الأجواء
     - البداية: غالباً بفعل مضارع أو اسم
     - عدم احتواء: نقطتين أو شرطات للحوار
     - التصنيف: \`action\`
  
  7. **قاعدة المونتاج والسلاسل**:
     - البداية: "مونتاج"، "سلسلة لقطات"، "MONTAGE"
     - المحتوى: قائمة من الأحداث المترابطة
     - التنسيق: غالباً مُرقَّم أو بنقاط
  
  #### 🟢 قواعد الأولوية المنخفضة (ثقة 50-69%):
  8. **قاعدة التصنيفات الغامضة**:
     - الأسطر القصيرة جداً (1-2 كلمة)
     - قد تكون: \`character\`، \`parenthetical\`، أو \`action\`
     - تتطلب تحليل سياق موسع (7+ أسطر)
  
  9. **قاعدة الصوت الخارجي والتعليق**:
     - المؤشرات: (V.O)، (O.S)، صوت من الخارج
     - التصنيف: \`voice-over\` أو \`off-screen\`
  
  ### المرحلة 4: التحليل التنبؤي والذكاء الاصطناعي
  
  #### خوارزميات التعلم الآلي المُطبَّقة:
  1. **تحليل الأنماط المتكررة**: كشف الأخطاء النمطية في التصنيف
  2. **التعلم من السياق**: تحسين الدقة بناءً على الأنماط المكتشفة
  3. **التنبؤ بالتصنيف**: توقع التصنيف الأكثر احتمالاً
  4. **كشف الشذوذ**: تحديد التصنيفات غير المنطقية
  
  ### المرحلة 5: إنشاء التصحيحات المُفصَّلة
  
  #### بنية كائن التصحيح المُحسَّنة:
  \`\`\`json
  {
    "index": "رقم السطر",
    "currentClass": "التصنيف الحالي",
    "suggestedClass": "التصنيف المقترح",
    "confidence": "high|medium|low|adaptive",
    "confidenceScore": 0-100,
    "reason": "شرح مفصل للسبب",
    "contextAnalysis": {
      "before": "تحليل السياق السابق",
      "after": "تحليل السياق اللاحق",
      "narrative": "التأثير على السرد"
    },
    "linguisticAnalysis": {
      "grammar": "التحليل النحوي",
      "style": "التحليل الأسلوبي",
      "dialect": "اللهجة المُكتشفة"
    },
    "alternativeClasses": [
      {
        "class": "تصنيف بديل",
        "probability": 0-100,
        "reason": "السبب"
      }
    ],
    "priority": "critical|high|medium|low",
    "affectedLines": ["أرقام الأسطر المتأثرة"],
    "suggestedAction": "correct|review|split|merge",
    "additionalNotes": "ملاحظات إضافية"
  }
  \`\`\`
  
  ## 📈 المقاييس والإحصائيات المُتقدمة
  ${includeMetrics ? `
  ### الإحصائيات المطلوبة:
  1. **إحصائيات عامة**:
     - إجمالي الأسطر المُحللة
     - عدد التصحيحات المقترحة
     - توزيع التصحيحات حسب مستوى الثقة
     - معدل الدقة الإجمالي المُقدَّر
  
  2. **تحليل التصنيفات**:
     - التصنيفات الأكثر إشكالية
     - أنماط الأخطاء المتكررة
     - التصنيفات الأكثر ثباتاً
  
  3. **تحليل الأداء**:
     - نسبة التصحيحات عالية الثقة
     - معدل الشك في التصنيفات
     - مؤشر جودة السيناريو
  
  4. **توصيات التحسين**:
     - اقتراحات لتحسين المُصنِّف الأولي
     - أنماط تحتاج لمراجعة بشرية
     - مناطق تحتاج لتدريب إضافي
  ` : ''}
  
  ## 🎯 القواعد الحاسمة النهائية
  1. **الدقة المطلقة**: الإخراج يجب أن يكون JSON صحيح 100%
  2. **عدم التخمين**: عند الشك، استخدم \`confidence: "low"\`
  3. **السياق أولاً**: لا تصحيح بدون تحليل سياقي كامل
  4. **احترام اللهجات**: مراعاة خصوصيات كل لهجة عربية
  5. **التوثيق الكامل**: كل تصحيح يجب أن يكون مُبرَّر بالتفصيل
  6. **الأولوية للأمان**: تجنب التصحيحات المشكوك فيها
  7. **التحليل المتدرج**: من العام إلى الخاص
  8. **المرونة الذكية**: التكيف مع أسلوب كل كاتب
  
  ## 🌍 السياق الثقافي واللهجات
  ### اللهجات المدعومة: ${JSON.stringify(dialectSupport)}
  - **الفصحى الحديثة (MSA)**: للأعمال التاريخية والرسمية
  - **المصرية**: الأكثر انتشاراً في السينما العربية
  - **الشامية**: لبنان، سوريا، الأردن، فلسطين
  - **الخليجية**: دول الخليج العربي
  - **المغاربية**: المغرب، تونس، الجزائر، ليبيا
  
  ### الاعتبارات الثقافية:
  - التعابير الدينية والثقافية
  - الألقاب والكُنى العربية
  - التراكيب اللغوية الخاصة بكل منطقة
  - المصطلحات السينمائية المحلية
  
  ## 🔄 عملية المراجعة النهائية
  1. **التحقق من التماسك**: مراجعة كل التصحيحات كوحدة واحدة
  2. **اختبار التدفق**: التأكد من أن التصحيحات تحسن السرد
  3. **التحقق المتبادل**: مقارنة التصحيحات مع بعضها
  4. **التصفية النهائية**: إزالة التصحيحات المتضاربة
  5. **ترتيب الأولويات**: تنظيم حسب الأهمية والثقة
  
  ## 📋 البيانات للتحليل
  \`\`\`json
  ${JSON.stringify(lines, null, 2)}
  \`\`\`
  
  ## ⚙️ إعدادات التشغيل الحالية
  - **نافذة السياق**: ${contextWindow} أسطر (ديناميكية)
  - **حد الثقة**: ${confidenceThreshold}
  - **التحليل العميق**: ${deepAnalysis}
  - **السياق الثقافي**: ${culturalContext}
  - **تضمين المقاييس**: ${includeMetrics}
  - **دعم اللهجات**: ${JSON.stringify(dialectSupport)}
  
  ## 🚀 ابدأ التحليل الآن
  قم بتطبيق جميع المراحل بدقة وأرجع النتائج بتنسيق JSON المُحدَّد.`;
  }
  
  // دالة متقدمة للتحليل المتخصص حسب النوع
  function buildUltraSpecializedAuditPrompt(lines, scriptType = 'drama', options = {}) {
    const scriptTypeProfiles = {
      'drama': {
        focus: 'العمق العاطفي والصراعات الداخلية',
        specialPatterns: [
          'المونولوج الداخلي',
          'الحوار الصامت',
          'التوتر الدرامي',
          'اللحظات الحاسمة',
          'الكشف التدريجي للشخصيات'
        ],
        keyIndicators: {
          dialogue: ['عواطف معقدة', 'صراعات شخصية', 'حوارات طويلة'],
          action: ['وصف تفصيلي للمشاعر', 'لغة الجسد المعبرة'],
          parenthetical: ['تغييرات عاطفية دقيقة', 'نبرات صوتية متنوعة']
        },
        contextWindow: 5,
        emotionalDepth: 'high'
      },
      'comedy': {
        focus: 'التوقيت الكوميدي والإيقاع السريع',
        specialPatterns: [
          'النكات والتورية',
          'المواقف الكوميدية',
          'التناقضات المضحكة',
          'الحوار السريع',
          'ردود الفعل المبالغة'
        ],
        keyIndicators: {
          dialogue: ['نكات', 'تلاعب بالألفاظ', 'سخرية'],
          action: ['مواقف مضحكة', 'حركات كوميدية'],
          parenthetical: ['توقيت كوميدي', 'ردود فعل مفاجئة']
        },
        contextWindow: 3,
        paceAnalysis: 'rapid'
      },
      'action': {
        focus: 'الحركة والإثارة والتسلسل الزمني',
        specialPatterns: [
          'مشاهد القتال',
          'المطاردات',
          'الانفجارات',
          'الحركات البهلوانية',
          'التصوير البطيء'
        ],
        keyIndicators: {
          action: ['أفعال حركية', 'وصف مفصل للحركة', 'مؤثرات خاصة'],
          dialogue: ['حوارات قصيرة', 'أوامر', 'صيحات'],
          transition: ['قطع سريع', 'انتقالات ديناميكية']
        },
        contextWindow: 7,
        visualPriority: 'maximum'
      },
      'thriller': {
        focus: 'التشويق والغموض وبناء التوتر',
        specialPatterns: [
          'الإشارات الخفية',
          'التلميحات',
          'المفاجآت',
          'الكشف المتأخر',
          'الأجواء المشحونة'
        ],
        keyIndicators: {
          action: ['وصف أجواء متوترة', 'حركات حذرة', 'مراقبة'],
          dialogue: ['حوارات غامضة', 'تهديدات مبطنة', 'أسرار'],
          parenthetical: ['همسات', 'نظرات ذات مغزى', 'توتر']
        },
        contextWindow: 6,
        suspenseLevel: 'high'
      },
      'horror': {
        focus: 'الرعب والأجواء المخيفة',
        specialPatterns: [
          'القفزات المفاجئة',
          'البناء البطيء للرعب',
          'الأصوات المخيفة',
          'الظلال والإضاءة',
          'العناصر الخارقة'
        ],
        keyIndicators: {
          action: ['أوصاف مرعبة', 'أجواء مظلمة', 'أصوات غريبة'],
          dialogue: ['صرخات', 'همسات مرعبة', 'تحذيرات'],
          parenthetical: ['خوف', 'رعب', 'توتر شديد']
        },
        contextWindow: 5,
        atmosphereAnalysis: 'critical'
      },
      'romance': {
        focus: 'العلاقات العاطفية والرومانسية',
        specialPatterns: [
          'اللحظات الحميمة',
          'الحوارات الرومانسية',
          'النظرات المتبادلة',
          'اللمسات العاطفية',
          'الصراعات العاطفية'
        ],
        keyIndicators: {
          dialogue: ['كلمات حب', 'اعترافات', 'وعود'],
          action: ['لمسات رقيقة', 'نظرات طويلة', 'قُبلات'],
          parenthetical: ['بحنان', 'بخجل', 'بشوق']
        },
        contextWindow: 4,
        emotionalNuance: 'delicate'
      },
      'documentary': {
        focus: 'المعلومات والحقائق والتوثيق',
        specialPatterns: [
          'التعليق الصوتي',
          'المقابلات',
          'الإحصائيات',
          'الوثائق',
          'اللقطات الأرشيفية'
        ],
        keyIndicators: {
          'voice-over': ['معلومات', 'شرح', 'سرد تاريخي'],
          'super': ['تواريخ', 'أماكن', 'أسماء'],
          dialogue: ['مقابلات', 'شهادات', 'آراء خبراء']
        },
        contextWindow: 4,
        factualAccuracy: 'essential'
      },
      'musical': {
        focus: 'الأغاني والرقصات والإيقاع',
        specialPatterns: [
          'كلمات الأغاني',
          'وصف الرقصات',
          'التحولات الموسيقية',
          'الكورال',
          'السولو الغنائي'
        ],
        keyIndicators: {
          dialogue: ['كلمات أغاني', 'إيقاع شعري'],
          action: ['حركات راقصة', 'وصف موسيقي'],
          parenthetical: ['يغني', 'يرقص', 'بإيقاع']
        },
        contextWindow: 5,
        rhythmAnalysis: 'critical'
      },
      'experimental': {
        focus: 'الأساليب غير التقليدية والابتكار',
        specialPatterns: [
          'السرد غير الخطي',
          'التداخل الزمني',
          'الرمزية',
          'كسر الجدار الرابع',
          'التجريب البصري'
        ],
        keyIndicators: {
          action: ['وصف تجريدي', 'رموز', 'صور سريالية'],
          dialogue: ['حوار فلسفي', 'تيار وعي', 'شعر'],
          transition: ['انتقالات غير تقليدية', 'قفزات زمنية']
        },
        contextWindow: 8,
        flexibilityLevel: 'maximum'
      },
      'animation': {
        focus: 'الوصف البصري والحركة المتخيلة',
        specialPatterns: [
          'وصف الشخصيات الكرتونية',
          'الحركات المبالغة',
          'التعابير الكرتونية',
          'المؤثرات البصرية',
          'عوالم خيالية'
        ],
        keyIndicators: {
          action: ['وصف مفصل للحركة', 'تعابير مبالغة', 'مؤثرات خاصة'],
          dialogue: ['أصوات كرتونية', 'حوارات بسيطة للأطفال'],
          parenthetical: ['أصوات غير بشرية', 'مؤثرات صوتية']
        },
        contextWindow: 4,
        visualDetail: 'extensive'
      }
    }
  };
  بالتأكيد، إليك الشيفرة المصدرية الكاملة بعد تحويلها إلى TypeScript، مع إضافة أنواع (Types) مفصلة لزيادة وضوح وأمان الشيفرة. لقد قمت أيضًا بتصحيح خطأ إملائي (قوس إغلاق إضافي) كان موجودًا في نهاية الملف الأصلي.

```typescript
// geminiService.ts

import { GEMINI_TEXT_MODEL } from '../constants/prompts';

// --- تعريف الأنواع (Type Definitions) ---

/**
 * يصف بنية الملف المراد إرساله إلى الواجهة البرمجية (API).
 */
interface GeminiFile {
  name: string;
  content: string;
  mimeType: string;
  isBase64: boolean;
}

/**
 * يصف بنية جزء البيانات المضمنة (inline_data) في الحمولة (payload).
 */
interface InlineDataPart {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

/**
 * يصف بنية الجزء النصي (text) في الحمولة (payload).
 */
interface TextPart {
  text: string;
}

// نوع موحد (union type) يجمع بين الأنواع المختلفة لأجزاء المحتوى
type ApiPart = TextPart | InlineDataPart;

/**
 * يصف البنية الكاملة لحمولة الطلب المرسلة إلى واجهة Gemini API.
 */
interface GeminiPayload {
  contents: [{
    parts: ApiPart[];
  }];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

/**
 * يصف بنية "المرشح" (candidate) في استجابة ناجحة من الواجهة البرمجية.
 */
interface GeminiResponseCandidate {
  content?: {
    parts?: [{
      text: string;
    }];
  };
}

/**
 * يصف البنية الكلية لاستجابة ناجحة من الواجهة البرمجية.
 */
interface GeminiApiResponse {
  candidates?: GeminiResponseCandidate[];
}

/**
 * يصف بنية استجابة الخطأ من الواجهة البرمجية.
 */
interface ApiErrorResponse {
  error?: {
    message: string;
  };
}


// --- دوال خدمة الواجهة البرمجية (API Service Functions) ---

/**
 * تقوم باستدعاء واجهة Gemini API مع الحمولة المحددة.
 * @param payload الحمولة التي سيتم إرسالها إلى Gemini API.
 * @returns Promise يحل إلى المحتوى النصي الذي تم إنشاؤه.
 */
export const callGeminiAPI = async (payload: GeminiPayload): Promise<string> => {
  // ملاحظة: في تطبيق حقيقي، يجب تخزين مفتاح API بشكل آمن.
  // في هذا العرض التوضيحي، سنستخدم قيمة مؤقتة يجب استبدالها.
  const apiKey: string = "YOUR_GEMINI_API_KEY_HERE"; 
  
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("يرجى إدخال مفتاح API الخاص بـ Gemini في ملف الخدمة");
  }
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const result: GeminiApiResponse = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error('Gemini API Error:', error);
    // إعادة رمي الخطأ ليتم التعامل معه من قبل الجهة المستدعية
    throw error;
  }
};

/**
 * تقوم ببناء كائن الحمولة (payload) الخاص باستدعاء Gemini API.
 * @param instruction التعليمات النصية الرئيسية للنموذج.
 * @param files مصفوفة من الملفات (نصية أو بترميز base64) لإدراجها في الطلب.
 * @returns كائن الحمولة المبني بالكامل.
 */
export const buildGeminiPayload = (instruction: string, files: GeminiFile[]): GeminiPayload => {
  const parts: ApiPart[] = [{ text: instruction }];
  
  // إضافة محتويات الملفات إلى الحمولة
  if (files && files.length > 0) {
    files.forEach((file: GeminiFile) => {
      if (file.isBase64) {
        // للصور وملفات PDF
        parts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: file.content
          }
        });
      } else {
        // للملفات النصية
        parts.push({
          text: `\n\n--- محتوى الملف: ${file.name} ---\n${file.content}\n--- نهاية الملف ---\n`
        });
      }
    });
  }

  return {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };
};
```
